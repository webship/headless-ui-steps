// react-flatpickr 3 (the major the playground asks for) is a CommonJS package: Vite's production build hands its default
// import over as the whole module ({ default: DateTimePicker }), and React then cannot draw it. This stand-in gives the
// two examples that use it (dialog/dialog and dialog/scrollable-dialog) the component itself.
import * as module from 'react-flatpickr/build/index.js';

type Loose = { default?: unknown };
const own = module as unknown as Loose;
const inner = (own.default as Loose | undefined);
const DateTimePicker = (inner && typeof inner === 'object' && 'default' in inner ? inner.default : own.default ?? module) as never;

export default DateTimePicker;
