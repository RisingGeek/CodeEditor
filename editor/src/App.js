import React from 'react';
import './App.css';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Editor from './Containers/Editor';
import Home from './Containers/Home';

function App() {
  return (
    <BrowserRouter>
    <div className="App">
        <Switch>
          <Route path='/' exact component={Home} />
          <Route path='/:id' exact component = {Editor} />
        </Switch>
    </div>
    </BrowserRouter>
  );
}

export default App;
