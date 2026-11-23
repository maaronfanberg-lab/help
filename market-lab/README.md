# The $20 Market Lab

A **free, automatically updated, strictly paper-traded** observation experiment.
It **does not accept deposits, access a bank, connect to a brokerage, or place real orders**.

It starts with **$20 virtual cash**, receives SPY daily open/close prices from Stooq,
and on each new observed trading day uses the *previous* day's 20/50-day simple
moving-average signal. Trading is assumed at the next trading day's opening
price with 0.15% estimated slippage. It chooses either SPY or cash, with no
margin, shorting, leverage, or derivatives.

Results are forward-tracked starting from the **first actual workflow run**.
They are compared with a paper buy-and-hold SPY benchmark over the same dates.
The experiment's reported results are **not backtested profits** and do not
represent real brokerage statements, verified execution, or guaranteed income.

## Automatic operation

GitHub Actions runs at 23:45 UTC on weekdays and can be run manually through
Actions > Paper Market Lab > Run workflow. The workflow uses Python standard
library only, executes tests, fetches market data, updates the JSON report, commits
the new virtual report, and dispatches the existing Pages deployment.
Temporary data-source failures are shown transparently in the report.

Mobile dashboard: /market-lab/ under the repository's GitHub Pages site.

## Real-world limitations

This does **not** make real money. A free paper experiment is an evidence
gathering tool only. It cannot convert a $20 starting balance into reliable
daily living expenses. Markets involve risk of loss; paper execution differs
from live execution. Do not provide brokerage credentials to this repository
or make it responsible for live orders.

Historical daily prices are supplied by Stooq, subject to their service
availability and data accuracy. No user secrets or private data are stored.
