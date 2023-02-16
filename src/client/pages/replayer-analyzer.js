import React from "react";
import Select from "react-select";
import {Col, Dropdown, Form, Row, Table} from "react-bootstrap";
import {saveGame, getPlayers, updatePlayer} from "../services/api";
import toastr from "toastr"

export class ReplayAnalyzer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            rounds: 3,
            playerOne: null,
            playerTwo: null,
            score: [["", ""], ["", ""], ["", ""]],
            players: null,
            value: {label: '', key : '001'},
            value2: {label: '', key : '002'}
        }
        this.updatePlayerOne = this.updatePlayerOne.bind(this);
        this.updatePlayerTwo = this.updatePlayerTwo.bind(this);
        this.updateScore = this.updateScore.bind(this);
        this.submit = this.submit.bind(this);
        this.playerOneWins = this.playerOneWins.bind(this);
    }

    render() {
        return (
            <div>
                <script src={"../../replay-analyzer/index.html"}/>
            </div>
        )
    }
}