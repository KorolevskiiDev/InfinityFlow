import { State } from '@/state/state';

export class ObservableState<T> extends State<T> {

    async waitFor(predicate: (value: T) => boolean): Promise<void> {
        if (predicate(this.get())) {
            return;
        }

        return new Promise((resolve) => {
            const unsubscribe = this.subscribe((value: any) => {
                if (predicate(value)) {
                    unsubscribe();
                    resolve();
                }
            });
        });
    }
}
