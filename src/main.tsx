import { render } from 'preact';
import { App } from './app/App';
import './ui/styles.css';

const root = document.getElementById('app');
if (!root) {
  throw new Error('#app root missing');
}

render(<App />, root);
