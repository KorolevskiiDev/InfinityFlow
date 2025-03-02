# InfinityFlow 🚀♾️
![npm](https://img.shields.io/npm/v/infinityflow) ![build](https://img.shields.io/github/actions/workflow/status/infinityflow/infinityflow/ci.yml) ![coverage](https://img.shields.io/codecov/c/github/infinityflow/infinityflow)

### The Ultimate TypeScript State Flow Management Library

InfinityFlow is a **lightweight, type-safe, and reactive state flow management library** built to handle complex service dependencies, automatic resets, and parallel flows — without breaking a sweat.

### Why InfinityFlow?
✅ Pure TypeScript, no dependencies  
✅ Automatic dependency resolution  
✅ Cancellable flows  
✅ Debounce support  
✅ Parallel flows & flow groups  
✅ Chained dependencies  
✅ Automatic flow reset on state change  
✅ Works in **browser** and **Node.js** environments

---

## Installation
```bash
npm install infinityflow
```

---

## Quick Start
### 1. Create Observable States
```typescript
import { ObservableState } from "infinityflow";

const websocketService = new ObservableState(false);
const microphoneService = new ObservableState(false);
```

### 2. Define Your Flow
```typescript
import { Flow } from "infinityflow";

const microphoneFlow = new Flow({autoReset: true, debounceTime: 1000})
  .dependsOn(websocketService, (state) => state === true)
  .do(() => console.log("Microphone Activated"));
```

### 3. Start Flow
```typescript
microphoneFlow.start();
websocketService.set(true);
```

---

## FlowGroups & Parallel Flows
Manage multiple flows together like a pro:
```typescript
import { FlowGroup } from "infinityflow";

const appFlow = new FlowGroup()
  .add(microphoneFlow, 1) // Priority 1
  .add(someOtherFlow, 2) // Priority 2
  .withCallbacks({
    onComplete: () => console.log("App Initialized")
  });

appFlow.start();
```

---

## API
### `State<T>`
- `.set(value: T)` — Update state
- `.get()` — Get current state
- `.subscribe(callback)` — Observe state changes
    
### `ObservableState<T>` extends `State<T>`
- `.waitFor(predicate)` — Wait for state to match predicate

### `Flow`
- `.dependsOn(state, predicate)` — Add dependency
- `.do(action)` — Add action to execute
- `.start()` — Start flow execution
- `.reset()` — Reset flow manually
- `.cancel()` — Cancel running flow

### `FlowGroup`
- `.add(flow, priority)` — Add flow with priority
- `.start()` — Start all flows
- `.reset()` — Reset all flows
- `.cancel()` — Cancel all flows

---

## What Makes InfinityFlow... Infinite?
✅ Infinite state reactivity  
✅ Zero external dependencies  
✅ Fully typed, fully reactive, fully awesome

---

## License
MIT

---

## Made with ❤️ by Korolevskii Dev

