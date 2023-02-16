import React from "react";
import {NavBar} from "./pages/navbar";
import "bulma";
import "toastr/toastr.scss";
import {Redirect, Route, Switch} from "react-router-dom";
import {PlayerStats} from "./pages/player-stats";
import {Home} from "./pages/home";
// import { ReplayAnalyzer } from "./pages/replayer-analyzer"
import stuff from "../replay-analyzer/index.html"
const html = `<h1>stuff</h1>`

// $.get("../replay-analyzer/index.html", "", function(data){
//     alert('success : ' + data);
// });

const ReplayAnalyzer = () => <div dangerouslySetInnerHTML={{ __html: html }} />;

export class App extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return <div>
            <NavBar/>
            <Switch>
                <Route path="/record" component={ReplayAnalyzer}/>
                <Route path="/stats" component={PlayerStats}/>
                <Route exact path="/" component={Home}/>
                <Redirect to={"/"} />
            </Switch>
        </div>;
    }
}
