// IMPORTANT: Always extend BaseState with your custom event map
// and use your extended state class in Flow for proper type inference.
// Import from the published entry point, not directly from dist/.
import { BaseState, BaseStateEventMap, Flow } from "../../src/index";

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

export type TodoEventMap = BaseStateEventMap<TodoStateShape> & {
    [TodoEvents.TodoAdded]: Todo;
    [TodoEvents.LoadingChanged]: boolean;
};

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

export const loadTodosFlow = new Flow<{ todo: TodoState }>({ todo: todoState })
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
    }).step(async (ctx) => {})

export const addTodoFlow = new Flow<{ todo: TodoState }>({ todo: todoState })
    .step(async (ctx, todo: Todo) => {
        const existingItems = ctx.todo.getState().items;
        ctx.todo.setState({ items: [...existingItems, todo] });
        ctx.todo.emit(TodoEvents.TodoAdded, todo);
        return todo;
    });

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
