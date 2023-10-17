"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = void 0;
var StateChild = /** @class */ (function () {
    function StateChild(parent, top) {
        // stores every event
        this.data = new Map();
        this.parent = parent;
        this.top = top;
    }
    StateChild.prototype.add = function () {
        var child = new StateChild(this, this.top);
        return child;
    };
    StateChild.prototype.set = function (name, callback) {
        this.data.set(name, callback);
        return this;
    };
    StateChild.prototype.run = function (name) {
        if (this.data.has(name))
            this.data.get(name)();
    };
    // sets up the inheritance stack.
    // when reaches the top of the tree (parent == null), 
    // the Stack controller begins running
    StateChild.prototype.delegate = function (name) {
        this.top['push'](this);
        if (this.parent != null) {
            this.parent.delegate(name);
        }
        else {
            this.top.child(name);
        }
        this.top['pop']();
    };
    return StateChild;
}());
var State = /** @class */ (function () {
    function State() {
        this.stack = [];
        this.depth = 0;
        this.running = false;
        // current running event name
        this.name = "";
        // the currently targeted state
        this.current = null;
        // if currently running, stores the next targeted state
        // current is set to deferchange at end of run()
        this.deferchange = null;
        this.time_state = 0;
        this.time_total = 0;
    }
    State.prototype.add = function () {
        var child = new StateChild(null, this);
        return child;
    };
    State.prototype.change = function (child) {
        if (!this.running) {
            this.forceChange(child);
            return;
        }
        this.deferchange = child;
    };
    State.prototype.forceChange = function (child) {
        this.run('leave');
        this.current = child;
        this.time_state = 0;
        this.run('enter');
    };
    State.prototype.child = function (name) {
        if (name === void 0) { name = this.name; }
        if (this.depth <= 0)
            return;
        var lastname = this.name;
        this.name = name;
        this.depth--;
        var child = this.stack[this.depth];
        if (child['data'].has(name))
            child.run(name);
        else
            this.child();
        this.depth++;
        this.name = lastname;
    };
    State.prototype.run = function (name) {
        if (name === void 0) { name = "step"; }
        if (this.current == undefined)
            return;
        this.running = true;
        this.depth = 0;
        this.name = name;
        this.current['delegate'](name);
        this.time_state += 1;
        this.time_total += 1;
        this.running = false;
        if (this.deferchange != null) {
            var child = this.deferchange;
            this.deferchange = null;
            this.change(child);
        }
    };
    State.prototype.is = function (child) {
        return this.current == child;
    };
    State.prototype.push = function (child) {
        this.stack.push(child);
        this.depth++;
    };
    State.prototype.pop = function () {
        this.stack.pop();
        this.depth--;
    };
    return State;
}());
exports.State = State;
