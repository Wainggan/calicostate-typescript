
import { State } from '../src/state';


const test = {
	success: true,
	collect: [] as any[],
	reset() {
		this.collect = [];
	}
}

const assert = (b: boolean, message: string) => {
	if (!b) {
		console.error(message);
		test.success = false;
	}
}

const assert_array = (a1: any[], a2: any[], name: string) => {
	if (a1.length != a2.length) {
		assert(false, `${name}: arrays not same length - ${a1} || ${a2}`);
		return;
	}
	for (let i = 0; i < a1.length; i++) {
		assert(a1[i] === a2[i], `${name}: i = ${i}`);
	}
}

const state = new State();

const state_layer0 = state.add()
.set('test', () => {
	test.collect.push("0 start")

	state.child()

	test.collect.push("0 end")
})
.set('overwrite', () => {
	test.collect.push('0 overwrite');
})

const state_layer1 = state_layer0.add()
.set('test', () => {
	test.collect.push("1 start")

	state.child()

	test.collect.push("1 end")
})
.set('enter', () => {
	test.collect.push('1 enter')

	state.child();
})
.set('overwrite', () => {
	test.collect.push('1 overwrite')
})

const state_layer2 = state_layer1.add()
.set('test', () => {
	test.collect.push("2 start")

	state.child()

	test.collect.push("2 end")
})
.set('enter', () => {
	test.collect.push('2 enter')

	state.child();
})

const state_layer3 = state_layer2.add()
.set('different', () => {
	test.collect.push("different")
})
.set('leave', () => {
	test.collect.push('3 leave');

	state.child();
})

const state_layer4 = state_layer3.add()
.set('test', () => {
	test.collect.push("4 start")

	test.collect.push("4 end");
})


state.change(state_layer4);
assert(state.is(state_layer4), 'change to layer4')
test.reset();

state.run('test');
assert_array(test.collect, ['0 start', '1 start', '2 start', '4 start', '4 end', '2 end', '1 end', '0 end'], 'test');
test.reset();

state.change(state_layer1);
assert_array(test.collect, ['3 leave', '1 enter'], 'change');
test.reset();

state.change(state_layer4);
assert_array(test.collect, ['1 enter', '2 enter'], 'change');
test.reset();

state.run('different');
assert_array(test.collect, ['different'], 'different');
test.reset();

state.run('overwrite');
assert_array(test.collect, ['0 overwrite'], 'overwrite');


const state_change1 = state_layer0.add()
.set('test', () => {

	state.change(state_layer0);
	assert(state.is(state_change2), 'change to layer0 inside change1 - should have no effect yet');

	state.child();

})

const state_change2 = state_change1.add()
.set('test', () => {
	assert(state.is(state_change2), 'after change to layer0 inside change1, inside change2 - should still have no effect yet');
})

state.change(state_change2);
assert(state.is(state_change2), 'change to change2 - has immediate effect')

state.run('test');
assert(state.is(state_layer0), 'change inside states take place after run')


const state_example = state_layer0.add()
.set('step', () => {
	test.collect.push(true);
})

test.reset()
state.change(state_example)
state.run()
assert_array(test.collect, [true], 'step default')


console.log(`success = ${test.success}`)

