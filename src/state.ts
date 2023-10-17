
class StateChildController {

	parent: StateChildController | null;
	top: StateController;
	data = new Map<string, () => void>();
	constructor(parent: StateChildController | null, top: StateController) {
		this.parent = parent;
		this.top = top;
	}

	add(): StateChildController {
		const child = new StateChildController(this, this.top);
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

	delegate(name: string) {
		this.top.push(this);
		if (this.parent != null) {
			this.parent.delegate(name);
		} else {
			this.top.child(name);
		}
		this.top.pop();
	}

}

class StateController {
	
	stack: StateChildController[] = [];
	depth: number = 0;
	name: string = "";
	deferchange: StateChildController | null = null;
	running: boolean = false;
	current: StateChildController | null = null;
	time: number = 0;
	
	add() {
		const child = new StateChildController(null, this);
		return child;
	}

	change(child: StateChildController) {
		if (!this.running) {
			this.forceChange(child);
			return;
		}
		this.deferchange = child;
	}

	forceChange(child: StateChildController) {
		this.run('leave');

		this.current = child;
		this.time = 0;

		this.run('enter');
	}

	child(name: string = this.name) {
		if (this.depth <= 0) return;

		let lastname = this.name;
		this.name = name;

		this.depth--;

		const child = this.stack[this.depth];
		if (child.data.has(name))
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
		this.current.delegate(name);

		this.time += 1;

		this.running = false;
		if (this.deferchange != null) {
			const child = this.deferchange;
			this.deferchange = null;
			this.change(child);
		}
	}

	is(child: StateChildController) {
		return this.current == child;
	}

	push(child: StateChildController) {
		this.stack.push(child);
		this.depth++;
	}

	pop() {
		this.stack.pop();
		this.depth--;
	}

}


class StateInherit {
	protected controller_state: StateController | null;
	protected controller_child: StateChildController | null;
}

export class StateChild extends StateInherit {

	controller_child: StateChildController;
	constructor(controller: StateChildController) {
		super();
		this.controller_child = controller;
	}

	add(): StateChild {
		const child = this.controller_child.add();
		return new StateChild(child);
	}

	set(name: string, callback: () => void): this {
		this.controller_child.set(name, callback);
		return this;
	}
}

export class State extends StateInherit {

	controller_state = new StateController();

	add() {
		const child = this.controller_state.add();
		return new StateChild(child);
	}

	is(child: StateChild) {
		return this.controller_state.current == child.controller_child;
	}

	run(name?: string) {
		this.controller_state.run(name);
	}

	child(name?: string) {
		this.controller_state.child(name);
	}

	change(child: StateChild) {
		this.controller_state.change(child.controller_child)
	}

}

