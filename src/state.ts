
class StateChild {

	private parent: StateChild | null;
	private top: State;

	// stores every event
	private data = new Map<string, () => void>();

	constructor(parent: StateChild | null, top: State) {
		this.parent = parent;
		this.top = top;
	}

	add(): StateChild {
		const child = new StateChild(this, this.top);
		return child;
	}

	set(name: string, callback: () => void): this {
		this.data.set(name, callback);
		return this;
	}

	run(name: string) {
		if (this.data.has(name))
			this.data.get(name)!();
	}

	// sets up the inheritance stack.
	// when reaches the top of the tree (parent == null), 
	// the Stack controller begins running
	private delegate(name: string) {
		this.top['push'](this);
		if (this.parent != null) {
			this.parent.delegate(name);
		} else {
			this.top.child(name);
		}
		this.top['pop']();
	}

}

export class State {

	private stack: StateChild[] = [];
	private depth: number = 0;

	private running: boolean = false;

	// current running event name
	private name: string = "";

	// the currently targeted state
	private current: StateChild | null = null;

	// if currently running, stores the next targeted state
	// current is set to deferchange at end of run()
	private deferchange: StateChild | null = null;

	private time_state: number = 0;
	private time_total: number = 0;

	add() {
		const child = new StateChild(null, this);
		return child;
	}

	change(child: StateChild) {
		if (!this.running) {
			this.forceChange(child);
			return;
		}
		this.deferchange = child;
	}

	private forceChange(child: StateChild) {
		this.run('leave');

		this.current = child;
		this.time_state = 0;

		this.run('enter');
	}

	child(name: string = this.name) {
		if (this.depth <= 0) return;

		let lastname = this.name;
		this.name = name;

		this.depth--;

		const child = this.stack[this.depth];
		if (child['data'].has(name))
			child.run(name);
		else
			this.child();

		this.depth++;

		this.name = lastname;
	}

	run(name: string = "step") {
		if (this.current == undefined) return;
		this.running = true;
		this.depth = 0;
		this.name = name;
		this.current['delegate'](name);

		this.time_state += 1;
		this.time_total += 1;

		this.running = false;
		if (this.deferchange != null) {
			const child = this.deferchange;
			this.deferchange = null;
			this.change(child);
		}
	}

	is(child: StateChild) {
		return this.current == child;
	}

	private push(child: StateChild) {
		this.stack.push(child);
		this.depth++;
	}

	private pop() {
		this.stack.pop();
		this.depth--;
	}

}
