import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "market_engine", Path(__file__).with_name("engine.py"))
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)


class PaperOnlyTests(unittest.TestCase):
    def test_no_signal_before_50_days(self):
        self.assertIsNone(engine.target([100.0] * 49))

    def test_signal_responds_to_data(self):
        self.assertTrue(engine.target([100.0] * 30 + [120.0] * 20))
        self.assertFalse(engine.target([120.0] * 30 + [100.0] * 20))

    def test_initial_day_is_only_cash_no_fake_backfill(self):
        prices = [{"date": f"2026-01-{i:02d}", "open": 100, "close": 100}
                  for i in range(1, 3)]
        state = engine.run_market(None, prices)
        self.assertEqual(state["last_processed"], "2026-01-02")
        self.assertEqual(len(state["history"]), 1)
        self.assertEqual(state["cash"], 20)
        self.assertEqual(state["trades"], [])

    def test_next_open_is_used_and_all_value_is_virtual(self):
        prices = [{"date": "2026-03-01", "open": 100, "close": 100},
                  {"date": "2026-03-02", "open": 102, "close": 104}]
        state = engine.initial_state(prices[0], [100] * 30 + [120] * 20)
        self.assertTrue(state["pending_target"])
        engine.step(state, prices[1], [100] * 31 + [120] * 20)
        self.assertEqual(state["cash"], 0)
        self.assertGreater(state["shares"], 0)
        self.assertGreater(state["history"][-1]["portfolio"], 20)
        report = engine.make_report(state)
        self.assertEqual(report["real_money_earned"], 0)
        self.assertEqual(report["real_money_invested"], 0)
        self.assertEqual(report["trades"][0]["side"], "BUY")
        self.assertAlmostEqual(report["trades"][0]["price"], 102 * 1.0015, 4)


if __name__ == "__main__":
    unittest.main()
