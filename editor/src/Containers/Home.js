import React, { Component } from 'react';
import { v4 } from 'uuid';
import HomeComponent from '../Components/Home/HomeComponent';

class Home extends Component {
    createId = () => {
        return v4();
    }

    render() {
        return (
            <HomeComponent
                createId={this.createId}
            />
        );
    }
}

export default Home;