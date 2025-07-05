# InfinityFlow 🚀♾️
![npm](https://img.shields.io/npm/v/infinityflow) ![build](https://img.shields.io/github/actions/workflow/status/KorolevskiiDev/InfinityFlow/publish.yml) ![coverage](https://img.shields.io/codecov/c/github/infinityflow/infinityflow)

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

## Features
- **Type-safe state management** with deep reactivity
- **Step-based flows** for orchestrating async and sync logic
- **Event-driven**: emit and listen to state and custom events
- **Composable**: flows and states can be combined and reused
- **Lifecycle callbacks** for flows (start, complete, error, etc.)

## Installation
```bash
npm install infinityflow
```

## Core Concepts

### BaseState
A reactive state container. Emits events on state changes and supports deep updates.

### Flow
A step-based orchestrator for business logic. Each step receives a context with access to state and event emitters.

### FlowCallbacks
Lifecycle hooks for flows: `onStart`, `onProgress`, `onComplete`, `onError`, `onReset`.

## Example: Todo App

```typescript
import { BaseState, BaseStateEvent } from "@/state/base_state";
import { Flow } from "@/flow/flow";

export interface Todo {
    id: number;
    text: string;
    done: boolean;
}

interface TodoStateShape {
    items: Todo[];
    loading: boolean;
}

export enum TodoEvents {
    TodoAdded = 'todoAdded',
    LoadingChanged = 'loadingChanged',
}

interface TodoEventMap {
    [BaseStateEvent.StateChange]: TodoStateShape;
    [TodoEvents.TodoAdded]: Todo;
    [TodoEvents.LoadingChanged]: boolean;
}

class TodoState extends BaseState<TodoStateShape, TodoEventMap> {
    constructor() {
        super({ items: [], loading: false });
    }
}

export const todoState = new TodoState();

todoState.on(TodoEvents.LoadingChanged, (loading) => {
    console.log("Loading state changed:", loading);
});

todoState.on(TodoEvents.TodoAdded, (todo) => {
    console.log("Todo added:", todo);
});

export const loadTodosFlow = new Flow({ todo: todoState })
    .step(async (ctx) => {
        ctx.todo.setState({ loading: true });
        ctx.todo.emit(TodoEvents.LoadingChanged, true);
        // Simulate async fetch
        await new Promise(r => setTimeout(r, 500));
        const items: Todo[] = [
            { id: 1, text: 'Learn TypeScript', done: false },
            { id: 2, text: 'Build a Todo App', done: false },
            { id: 3, text: 'Write Tests', done: true }
        ];
        ctx.todo.setState({ items, loading: false });
        ctx.todo.emit(TodoEvents.LoadingChanged, false);
        return items;
    });

export const addTodoFlow = new Flow({ todo: todoState })
    .step(async (ctx, todo: Todo) => {
        const existingItems = ctx.todo.getState().items;
        ctx.todo.setState({ items: [...existingItems, todo] });
        ctx.todo.emit(TodoEvents.TodoAdded, todo);
        return todo;
    });

// Usage
(async () => {
    await loadTodosFlow.withCallbacks({
        onStart: () => console.log("Loading todos..."),
        onComplete: () => console.log("Todos loaded successfully!"),
        onError: (error) => console.error("Error loading todos:", error)
    }).start({ userId: '123' });

    await addTodoFlow.withCallbacks({
        onStart: () => console.log("Adding todo..."),
        onComplete: () => console.log("Todo added!"),
        onError: (error) => console.error("Error adding todo:", error)
    }).start({ id: 4, text: 'Refactor state management', done: false });
})();
```

## API Reference

### BaseState
- `constructor(initialState)` — create a new state container
- `getState()` — get current state (readonly)
- `setState(patch)` — update state (deep merge)
- `on(event, handler)` — listen to state or custom events
- `emit(event, data)` — emit custom events

### Flow
- `new Flow({ ...states })` — create a flow with state dependencies
- `.step(fn)` — add a step to the flow
- `.withCallbacks(callbacks)` — attach lifecycle callbacks
- `.start(input)` — start the flow

### FlowCallbacks
- `onStart`, `onProgress`, `onComplete`, `onError`, `onReset`

## License
MIT

