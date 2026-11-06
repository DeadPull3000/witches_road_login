import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { GameSession } from './game/session';
import { IndexedRepository } from './persistence/repository';
import './style.css';

const root = createRoot(document.getElementById('root')!);
const session = new GameSession(new IndexedRepository());
root.render(<p className="boot-message" role="status">Lighting a candle at Westview…</p>);
void session.boot().then(() => root.render(<App session={session} />));
