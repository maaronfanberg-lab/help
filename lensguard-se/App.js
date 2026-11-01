import React, { useEffect, useRef, useState } from 'react';
import { AppState, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BleManager } from 'react-native-ble-plx';

const C = { background: '#081520', panel: '#142737', pale: '#edf8ff', muted: '#a7becc', teal: '#68ebda', gold: '#ffc981', warning: '#ff9f92', border: '#294353' };
const fmt = n => Number.isFinite(n) ? n.toFixed(1) : '—';
const fieldSize = s => Math.hypot(s.x, s.y, s.z);
const THRESHOLDS = [6, 12, 25];

function Button({ label, press, selected=false, disabled=false }) {
  return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={press}
    style={[styles.button, selected && styles.chosen, disabled && {opacity:0.45}]}>
    <Text style={[styles.buttonLabel, selected && {color:C.background}]}>{label}</Text>
  </TouchableOpacity>;
}
function Panel({title,children}) {
  return <View style={styles.panel}><Text style={styles.panelTitle}>{title}</Text>{children}</View>;
}
function Note({children,warning=false}) {
  return <Text style={[styles.note,warning && {color:C.gold}]}>{children}</Text>;
}
function MagnetScreen({visible,foreground}) {
  const [available,setAvailable] = useState(null);
  const [enabled,setEnabled] = useState(true);
  const [reading,setReading] = useState(null);
  const [history,setHistory] = useState([]);
  const [baseline,setBaseline] = useState(null);
  const [sensitivity,setSensitivity] = useState(1);
  const [error,setError] = useState('');
  const current = useRef(null);

  useEffect(() => {
    let valid=true;
    Magnetometer.isAvailableAsync().then(ok=>{if(valid)setAvailable(ok);})
      .catch(()=>{if(valid){setAvailable(false);setError('Unable to access magnetometer');}});
    return ()=>{valid=false;};
  },[]);
  useEffect(() => {
    if (!visible || !foreground || !enabled || !available) return;
    let subscription;
    try {
      Magnetometer.setUpdateInterval(150);
      subscription = Magnetometer.addListener(s => {
        if (![s.x,s.y,s.z].every(Number.isFinite)) return;
        const next = {...s,total:fieldSize(s)};
        current.current=next;
        setReading(next);
        setHistory(old => [...old.slice(-43),next.total]);
      });
    } catch (e) {setError('Magnetometer failed to start');}
    return () => subscription?.remove();
  },[visible,foreground,enabled,available]);

  const delta = reading && baseline!==null ? Math.abs(reading.total-baseline) : null;
  const alert = delta!==null && delta>=THRESHOLDS[sensitivity];
  const min=history.length?Math.min(...history):0;
  const max=history.length?Math.max(...history):1;
  const range=Math.max(max-min,1);
  return <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
    <Panel title="Magnetic-field scanner">
      <Note>Live readings from your iPhone magnetometer. Units are microtesla (μT), not radio-frequency power.</Note>
      <Text style={styles.big}>{reading ? fmt(reading.total) : '—'} <Text style={styles.units}>μT</Text></Text>
      <Text style={styles.small}>{available===false?'Sensor unavailable':available===null?'Checking sensor…':!foreground?'Paused while app is inactive':!enabled?'Paused':'Measuring'}</Text>
      {!!error && <Note warning>{error}</Note>}
      <View style={styles.xyz}><Text style={styles.small}>X {reading?fmt(reading.x):'—'}</Text><Text style={styles.small}>Y {reading?fmt(reading.y):'—'}</Text><Text style={styles.small}>Z {reading?fmt(reading.z):'—'}</Text></View>
      <View style={styles.chart} accessibilityLabel="Recent magnetic field history graph">
        {history.map((v,i)=><View key={i} style={[styles.chartBar,{height:Math.max(3,75*(v-min)/range)}]}/>)}
      </View>
      <View style={styles.row}>
        <Button label={enabled?'Pause':'Resume'} press={()=>setEnabled(x=>!x)}/>
        <Button label="Clear graph" press={()=>setHistory([])}/>
      </View>
    </Panel>
    <Panel title="Compare with baseline">
      <Note>Hold phone in the same orientation and set a reference away from the object. Then move slowly toward it. Speakers, steel, magnets, and other ordinary items can change readings.</Note>
      <View style={styles.row}>
        <Button label="Set baseline" disabled={!reading} press={()=>setBaseline(current.current?.total ?? null)}/>
        <Button label="Reset" press={()=>setBaseline(null)}/>
      </View>
      <Text style={styles.metric}>Reference: {baseline===null?'not set':fmt(baseline)+' μT'}</Text>
      <Text style={styles.metric}>Difference: {delta===null?'—':fmt(delta)+' μT'}</Text>
      <Text style={[styles.outcome,{color:alert?C.gold:C.teal}]}>{baseline===null?'Set a baseline to compare':alert?'Field change above threshold':'Below selected threshold'}</Text>
      <Text style={styles.small}>Sensitivity</Text>
      <View style={styles.row}>
        {['High','Medium','Low'].map((name,i)=><Button key={name} label={name} selected={i===sensitivity} press={()=>setSensitivity(i)}/>)}
      </View>
      <Note>Threshold: {THRESHOLDS[sensitivity]} μT. This is an anomaly alert, NOT proof of a camera.</Note>
    </Panel>
    <Note warning>A flat graph does not exclude hidden cameras or transmitters. Magnetometers do not measure arbitrary RF broadcasts.</Note>
  </ScrollView>;
}
function BluetoothScreen({visible,foreground}) {
  const manager=useRef(null);
  const [powered,setPowered]=useState('Unknown');
  const [scanning,setScanning]=useState(false);
  const [devices,setDevices]=useState({});
  const [error,setError]=useState('');
  useEffect(()=>{
    try {
      const instance=new BleManager();
      manager.current=instance;
      const sub=instance.onStateChange(state=>{
        setPowered(state);
        if(state!=='PoweredOn'){instance.stopDeviceScan();setScanning(false);}
      },true);
      return ()=>{sub.remove();instance.stopDeviceScan();instance.destroy();manager.current=null;};
    } catch(e){setError('Bluetooth module unavailable. Install a native development build, not Expo Go.');}
  },[]);
  useEffect(()=>{
    if(scanning && (!visible||!foreground)) {
      manager.current?.stopDeviceScan();
      setScanning(false);
    }
  },[scanning,visible,foreground]);
  function start(){
    if(!manager.current||powered!=='PoweredOn') return;
    setDevices({});
    setError('');
    try {
      manager.current.startDeviceScan(null,{allowDuplicates:true},(err,device)=>{
        if(err){setError(err.message||'Bluetooth scan failed');manager.current?.stopDeviceScan();setScanning(false);return;}
        if(!device||!Number.isFinite(device.rssi))return;
        const at=Date.now();
        setDevices(previous=>({
          ...previous,
          [device.id]:{
            id:device.id,
            name:device.name||device.localName||'Unnamed advertising device',
            rssi:device.rssi,
            seen:at,
            samples:(previous[device.id]?.samples??0)+1
          }
        }));
      });
      setScanning(true);
    } catch(e){setError(String(e?.message||e));setScanning(false);}
  }
  function stop(){manager.current?.stopDeviceScan();setScanning(false);}
  const results=Object.values(devices).sort((a,b)=>b.rssi-a.rssi);
  return <ScrollView contentContainerStyle={styles.body}>
    <Panel title="Bluetooth RF scanner">
      <Note>This is a genuine 2.4 GHz Bluetooth Low Energy discovery scan. It shows devices that advertise to your iPhone, not arbitrary RF transmissions.</Note>
      <Text style={styles.metric}>Bluetooth: {powered}</Text>
      <Text style={styles.metric}>Found: {results.length} advertising devices</Text>
      <View style={styles.row}><Button label={scanning?'Stop scan':'Start scan'} disabled={powered!=='PoweredOn'} press={scanning?stop:start}/><Button label="Clear" press={()=>setDevices({})}/></View>
      {!!error && <Note warning>{error}</Note>}
      {powered!=='PoweredOn' && <Note warning>Bluetooth must be enabled and permission granted. If permission was denied, check iPhone Settings.</Note>}
      <Note>RSSI is received signal strength in dBm. Higher (less negative) often means nearer, but walls, body position, antennas, and reflections can change it dramatically.</Note>
    </Panel>
    <Panel title="Nearby signals">
      {!results.length && <Note>No advertisements observed yet. Devices may be silent or use other wireless technologies.</Note>}
      {results.slice(0,60).map(d=><View key={d.id} style={styles.device}>
        <View style={styles.rowSpread}><Text style={styles.deviceName} numberOfLines={2}>{d.name}</Text><Text style={styles.dbm}>{d.rssi} dBm</Text></View>
        <Text style={styles.small}>Observed {d.samples} times • {Math.round((Date.now()-d.seen)/1000)} seconds ago</Text>
        <Text style={styles.small}>Anonymous device identifier: {d.id.slice(0,16)}…</Text>
      </View>)}
    </Panel>
    <Note warning>Some hidden cameras do not advertise Bluetooth. A device appearing here is not evidence that it has a camera. BLE scans cannot see normal Wi-Fi or cellular traffic.</Note>
  </ScrollView>;
}
function OpticalScreen({visible}) {
  const [permission,requestPermission]=useCameraPermissions();
  const [torch,setTorch]=useState(false);
  const [zoom,setZoom]=useState(0);
  useEffect(()=>{if(!visible)setTorch(false);},[visible]);
  if(!visible)return null;
  return <ScrollView contentContainerStyle={styles.body}>
    <Panel title="Camera lens inspection">
      <Note>Use the rear camera to inspect suspect objects. Rotate the phone and change your angle slowly, looking for concentrated reflections. Ordinary screws and shiny surfaces can produce false positives.</Note>
      {!permission?.granted ? <>
        <Text style={styles.metric}>Camera permission required</Text>
        <Button label="Grant camera access" press={requestPermission}/>
        {permission && !permission.canAskAgain && <Note warning>Enable camera permission in iPhone Settings.</Note>}
      </> : <>
        <View style={styles.preview}><CameraView style={StyleSheet.absoluteFill} facing="back" mode="picture" enableTorch={torch} zoom={zoom}/><View pointerEvents="none" style={styles.crosshair}><Text style={{fontSize:36,color:C.teal}}>⊕</Text></View></View>
        <View style={styles.row}>
          <Button label={torch?'Light on':'Light off'} selected={torch} press={()=>setTorch(v=>!v)}/>
          <Button label="Zoom −" disabled={zoom<0.05} press={()=>setZoom(v=>Math.max(0,v-0.1))}/>
          <Button label="Zoom +" disabled={zoom>0.95} press={()=>setZoom(v=>Math.min(1,v+0.1))}/>
        </View>
        <Note>This shows a live camera image only. It does not automatically classify reflections as hidden cameras and does not record or upload images.</Note>
      </>}
    </Panel>
  </ScrollView>;
}
export default function App(){
  const [tab,setTab]=useState('Magnetic');
  const [foreground,setForeground]=useState(AppState.currentState==='active');
  useEffect(()=>{
    const sub=AppState.addEventListener('change',state=>setForeground(state==='active'));
    return ()=>sub.remove();
  },[]);
  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="light-content"/>
    <View style={styles.header}><Text style={styles.brand}>LensGuard <Text style={{color:C.teal}}>SE</Text></Text><Text style={styles.subtitle}>Real readings. Careful conclusions.</Text></View>
    <View style={styles.tabs}>
      {['Magnetic','Bluetooth','Optical'].map(t=><TouchableOpacity key={t} accessibilityRole="tab" accessibilityState={{selected:t===tab}} onPress={()=>setTab(t)} style={[styles.tab,t===tab&&styles.activeTab]}><Text style={[styles.tabText,t===tab&&{color:C.teal}]}>{t}</Text></TouchableOpacity>)}
    </View>
    <View style={{flex:1}}>
      {tab==='Magnetic'&&<MagnetScreen visible={true} foreground={foreground}/>}
      {tab==='Bluetooth'&&<BluetoothScreen visible={true} foreground={foreground}/>}
      <OpticalScreen visible={tab==='Optical'}/>
    </View>
    <View style={styles.footer}><Text style={styles.footerText}>Privacy-first prototype • Not a guarantee of detection</Text></View>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:C.background},
  header:{paddingHorizontal:19,paddingTop:10,paddingBottom:15},
  brand:{fontSize:27,fontWeight:'800',color:C.pale},
  subtitle:{fontSize:12,color:C.muted,marginTop:3},
  tabs:{flexDirection:'row',marginHorizontal:14,marginBottom:6,backgroundColor:C.panel,borderRadius:13,padding:4},
  tab:{flex:1,paddingVertical:12,alignItems:'center',borderRadius:10},
  activeTab:{backgroundColor:C.background},
  tabText:{color:C.muted,fontSize:13,fontWeight:'700'},
  body:{padding:14,paddingBottom:36},
  panel:{borderWidth:1,borderColor:C.border,borderRadius:16,backgroundColor:C.panel,padding:15,marginBottom:14},
  panelTitle:{fontSize:18,color:C.pale,fontWeight:'800',marginBottom:9},
  note:{fontSize:13,lineHeight:19,color:C.muted,marginVertical:9},
  big:{fontSize:51,color:C.teal,fontWeight:'800',textAlign:'center',fontVariant:['tabular-nums'],marginVertical:12},
  units:{fontSize:21,fontWeight:'500',color:C.muted},
  xyz:{flexDirection:'row',justifyContent:'space-between',paddingVertical:9},
  small:{fontSize:12,color:C.muted,lineHeight:19},
  chart:{height:90,flexDirection:'row',alignItems:'flex-end',overflow:'hidden',gap:2,marginVertical:12,borderBottomColor:C.border,borderBottomWidth:1},
  chartBar:{flex:1,backgroundColor:C.teal,borderTopLeftRadius:2,borderTopRightRadius:2},
  row:{flexDirection:'row',flexWrap:'wrap',gap:7,marginVertical:11},
  button:{paddingHorizontal:13,paddingVertical:11,backgroundColor:C.border,borderRadius:11,alignItems:'center'},
  chosen:{backgroundColor:C.teal},
  buttonLabel:{fontSize:13,fontWeight:'800',color:C.pale},
  metric:{color:C.pale,fontSize:16,marginTop:9,fontWeight:'600'},
  outcome:{fontSize:17,fontWeight:'800',marginVertical:13},
  device:{borderTopColor:C.border,borderTopWidth:1,paddingVertical:12},
  deviceName:{fontSize:15,color:C.pale,flex:1,fontWeight:'700',marginRight:8},
  dbm:{fontSize:15,color:C.teal,fontWeight:'700'},
  rowSpread:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  preview:{height:300,backgroundColor:'#000',marginTop:15,borderRadius:10,overflow:'hidden'},
  crosshair:{...StyleSheet.absoluteFillObject,justifyContent:'center',alignItems:'center'},
  footer:{padding:8,borderTopColor:C.border,borderTopWidth:1},
  footerText:{textAlign:'center',fontSize:10,color:C.muted}
});
