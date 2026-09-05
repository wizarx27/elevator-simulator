import { useEffect, useState } from 'react'

const FLOORS = Array.from({ length: 30 }, (_, index) => 30 - index)
const SPEEDS = { Slow: 1100, Normal: 650, Fast: 300 }
const initialElevators = (count) => Array.from({ length: count }, (_, index) => ({ id: index + 1, floor: index ? 30 : 1, direction: 'Idle', seconds: 0 }))

function nextStop(elevator, calls) {
  const assigned = calls.filter((call) => call.elevatorId === elevator.id)
  const stops = assigned.filter((call) => call.destination || call.pickup !== elevator.floor || call.travelDirection === elevator.direction).map((call) => call.destination ?? call.pickup)
  if (!stops.length) {
    const oppositeCallHere = assigned.some((call) => !call.destination && call.pickup === elevator.floor && call.travelDirection !== elevator.direction)
    return oppositeCallHere && elevator.direction !== 'Idle' ? elevator.direction === 'Up' ? 30 : 1 : null
  }
  const ahead = stops.filter((stop) => elevator.direction === 'Up' ? stop > elevator.floor : elevator.direction === 'Down' ? stop < elevator.floor : false)
  if (ahead.length) return ahead.sort((a, b) => Math.abs(a - elevator.floor) - Math.abs(b - elevator.floor))[0]
  return stops.sort((a, b) => Math.abs(a - elevator.floor) - Math.abs(b - elevator.floor))[0]
}

export default function App() {
  const [mode, setMode] = useState(1)
  const [elevators, setElevators] = useState(initialElevators(1))
  const [speed, setSpeed] = useState('Normal')
  const [calls, setCalls] = useState([])
  const [waitingCallId, setWaitingCallId] = useState(null)
  const waitingCall = calls.find((call) => call.id === waitingCallId)

  const requestedCalls = (floor, direction) => calls.some((call) => call.pickup === floor && call.travelDirection === direction && !call.destination)
  const waitingElevator = elevators.find((elevator) => elevator.id === waitingCall?.elevatorId)

  useEffect(() => {
    if (mode !== 2 || waitingCallId) return
    const transferable = calls.find((call) => {
      if (call.destination) return false
      const assigned = elevators.find((elevator) => elevator.id === call.elevatorId)
      const alternative = elevators.find((elevator) => elevator.id !== call.elevatorId && elevator.direction === 'Idle')
      return alternative && assigned.direction !== 'Idle' && Math.abs(alternative.floor - call.pickup) < Math.abs(assigned.floor - call.pickup)
    })
    if (!transferable) return
    const alternative = elevators.find((elevator) => elevator.id !== transferable.elevatorId && elevator.direction === 'Idle')
    setCalls((items) => items.map((call) => call.id === transferable.id ? { ...call, elevatorId: alternative.id } : call))
  }, [calls, elevators, mode, waitingCallId])

  useEffect(() => {
    if (waitingCallId) return undefined
    const arrivedDestination = calls.find((call) => call.destination && elevators.find((elevator) => elevator.id === call.elevatorId)?.floor === call.destination)
    if (arrivedDestination) { setCalls((items) => items.filter((call) => call.id !== arrivedDestination.id)); return undefined }
    const pickupHere = calls.find((call) => { const elevator = elevators.find((item) => item.id === call.elevatorId); return !call.destination && elevator?.floor === call.pickup && (elevator.direction === 'Idle' || elevator.direction === call.travelDirection) })
    if (pickupHere) { setWaitingCallId(pickupHere.id); return undefined }
    if (!calls.length) {
      if (elevators.some((elevator) => elevator.direction !== 'Idle')) setElevators((items) => items.map((elevator) => ({ ...elevator, direction: 'Idle' })))
      return undefined
    }
    const timer = window.setTimeout(() => setElevators((items) => items.map((elevator) => {
      const target = nextStop(elevator, calls)
      if (!target || target === elevator.floor) return { ...elevator, direction: 'Idle' }
      const direction = target > elevator.floor ? 'Up' : 'Down'
      return { ...elevator, floor: elevator.floor + (direction === 'Up' ? 1 : -1), direction, seconds: elevator.seconds + SPEEDS[speed] / 1000 }
    })), SPEEDS[speed])
    return () => window.clearTimeout(timer)
  }, [calls, elevators, speed, waitingCallId])

  function callElevator(pickup, travelDirection) {
    if (requestedCalls(pickup, travelDirection)) return
    const idleElevators = elevators.filter((elevator) => elevator.direction === 'Idle' && !calls.some((call) => call.elevatorId === elevator.id))
    const candidates = idleElevators.length ? idleElevators : elevators
    const assignedElevator = [...candidates].sort((a, b) => Math.abs(a.floor - pickup) - Math.abs(b.floor - pickup))[0]
    setCalls((items) => [...items, { id: `${pickup}-${travelDirection}-${Date.now()}`, pickup, travelDirection, destination: null, elevatorId: assignedElevator.id }])
  }
  function chooseDestination(destination) { setCalls((items) => items.map((call) => call.id === waitingCallId ? { ...call, destination } : call)); setWaitingCallId(null) }
  function cancelRide() { setCalls((items) => items.filter((call) => call.id !== waitingCallId)); setWaitingCallId(null) }
  function setElevatorMode(count) { setMode(count); setCalls([]); setWaitingCallId(null); setElevators(initialElevators(count)) }
  function reset() { setCalls([]); setWaitingCallId(null); setElevators(initialElevators(mode)) }
  function resetTime() { setElevators((items) => items.map((elevator) => ({ ...elevator, seconds: 0 }))) }
  const selectableFloors = waitingCall ? FLOORS.filter((item) => waitingCall.travelDirection === 'Up' ? item > waitingElevator.floor : item < waitingElevator.floor) : []

  return <main className="app-shell">
    <section className="intro"><div><p className="eyebrow">30-floor building</p><h1>Elevator simulator</h1></div><div className="top-actions"><button className="reset" type="button" onClick={resetTime}>Reset time</button><button className="reset" type="button" onClick={reset}>Reset simulator</button></div></section>
    <div className="mode-control"><span>Elevator mode</span><button className={mode === 1 ? 'selected' : ''} onClick={() => setElevatorMode(1)}>1 elevator</button><button className={mode === 2 ? 'selected' : ''} onClick={() => setElevatorMode(2)}>2 elevators</button></div>
    <section className="dashboard" aria-label="Elevator controls and status"><aside className="elevator-cards">{elevators.map((elevator) => <ElevatorCard key={elevator.id} elevator={elevator} calls={calls} speed={speed} setSpeed={setSpeed} />)}</aside><section className="floors" aria-label="Building floors"><div className="floor-heading"><h2>Call elevator</h2><p>Both elevators work equally and accept the best available call.</p></div><div className="floor-list">{FLOORS.map((item) => <div className={`floor-row ${elevators.some((elevator) => elevator.floor === item) ? 'current' : ''}`} key={item}><span>Floor <b>{item}</b></span><div className="call-buttons">{item < 30 && <button type="button" disabled={requestedCalls(item, 'Up')} onClick={() => callElevator(item, 'Up')}>↑ Up</button>}{item > 1 && <button type="button" disabled={requestedCalls(item, 'Down')} onClick={() => callElevator(item, 'Down')}>↓ Down</button>}</div></div>)}</div></section></section>
    {waitingCall && <div className="modal-backdrop"><section className="destination-modal" aria-live="polite"><p className="eyebrow">Elevator {waitingCall.elevatorId} is stopping at floor {waitingElevator.floor}</p><h2>Where are you going?</h2><p>Select a floor in the {waitingCall.travelDirection.toLowerCase()} direction.</p><div className="destination-grid">{selectableFloors.map((item) => <button key={item} type="button" onClick={() => chooseDestination(item)}>{item}</button>)}</div><button className="cancel-ride" type="button" onClick={cancelRide}>Cancel ride</button></section></div>}
  </main>
}

function ElevatorCard({ elevator, calls, speed, setSpeed }) {
  const ownCalls = calls.filter((call) => call.elevatorId === elevator.id)
  const minutes = Math.floor(elevator.seconds / 60)
  const seconds = Math.floor(elevator.seconds % 60)
  return <section className="elevator-card"><p className="card-label">Elevator {elevator.id} status</p><div className="floor-display"><span>{elevator.floor}</span><small>FLOOR</small></div><p className={`direction ${elevator.direction.toLowerCase()}`}>{elevator.direction === 'Idle' ? '● Idle' : elevator.direction === 'Up' ? '↑ Moving up' : '↓ Moving down'}</p><div className="travel-time"><span>Travel time</span><strong>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</strong></div><div className="speed-control"><span>Travel speed</span><div>{Object.keys(SPEEDS).map((option) => <button key={option} type="button" className={speed === option ? 'selected' : ''} onClick={() => setSpeed(option)}>{option}</button>)}</div></div><div className="queue"><strong>Active stops</strong>{ownCalls.length ? <ol>{ownCalls.map((call) => <li key={call.id}>Floor {call.destination ?? call.pickup}{call.destination ? ' (destination)' : ` · call ${call.travelDirection}`}</li>)}</ol> : <p>No calls yet.</p>}</div></section>
}
