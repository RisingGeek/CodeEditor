import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {v4} from 'uuid';

class Home extends Component {
    createId = () => {
        return v4();
    }

    render() {
        return(
            <div>
                <Link to={`/CodeEditor/${this.createId()}`}>create editor</Link>
            </div>
        );
    }
}

export default Home;