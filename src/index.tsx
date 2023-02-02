import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import { Menu, Item } from "./Menu";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Menu
      renderTrigger={(props) => <button {...props}>Actions</button>}
      onAction={alert}
      // isOpen
    >
      <Item key="copy">Copy application</Item>
      <Item key="rename">Rename application</Item>
      <Item key="move" title="Move to">
        <Item key="move-to-shared">Shared</Item>
        <Item key="move-to-desktop">Desktop</Item>
        <Item key="move-to-favorite">Favorite</Item>
      </Item>
      <Item key="delete">Delete application</Item>
    </Menu>
  </React.StrictMode>
);
