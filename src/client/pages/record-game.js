import React from "react";
import Select from "react-select";
import {Col, Dropdown, Form, Row, Table} from "react-bootstrap";
import {saveGame, getPlayers, updatePlayer} from "../services/api";
import toastr from "toastr"

export class RecordGame extends React.Component {

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

    componentDidMount() {
        getPlayers().then((players) => {
            for (let i = 0; i < players.data.length; i++) {
                players.data[i].label = `${players.data[i].name}`;
                players.data[i].value = `${players.data[i].id}`;
            }
            this.setState({ players: players.data });
        })
    }

    resetState() {
        getPlayers().then((players) => {
            for (let i = 0; i < players.data.length; i++) {
                players.data[i].label = `${players.data[i].name}`;
                players.data[i].value = `${players.data[i].id}`;
            }
            this.setState({
                rounds: 3,
                playerOne: null,
                playerTwo: null,
                score: [["", ""], ["", ""], ["", ""]],
                players: players.data,
                value: {label: '', key : '001'},
                value2: {label: '', key : '002'}
            })
        })
    }

    submit() {
        if (this.validFields()) {
            let playerOneVictory = this.playerOneWins();
            let game = {
                player_one: this.state.playerOne.id,
                player_two: this.state.playerTwo.id,
                player_one_win: playerOneVictory,
                score: this.formatScore(),
                date_played: new Date().toISOString(),
            }
            try {
                saveGame(game).then((res) => {
                    if ((this.state.playerOne.name === "Harrison" && game.player_one_win) ||
                        (this.state.playerTwo.name === "Harrison" && !game.player_one_win)) {
                        toastr.success("Game recorded, another effortless victory for Harrison")
                    } else if ((this.state.playerOne.name === "Harrison" && !game.player_one_win) ||
                            (this.state.playerTwo.name === "Harrison" && game.player_one_win)) {
                        toastr.success("Game recorded, you'll get em' next time Harrison")
                    } else {
                        toastr.success("Game recorded")
                    }

                    // Update player info
                    let [player_one, player_two] = this.getPlayerStats(game);
                    updatePlayer(player_one, this.state.playerOne.id).then(() => {
                        updatePlayer(player_two, this.state.playerTwo.id).then(() => {
                            this.resetState();
                        })
                    }).catch(() => {
                        toastr.error("Unhandled error when updating player stats")
                    })
                })
            }
            catch {
                toastr.error("Error recording game")
            }
        }
    }

    getPlayerStats(game) {
        let player_one = structuredClone(this.state.playerOne);
        let player_two = structuredClone(this.state.playerTwo);
        if (game.player_one_win) {
            player_one.games_won++
            player_two.games_lost++
        } else {
            player_two.games_won++
            player_one.games_lost++
        }
        let p1RoundsWon = 0
        let p2RoundsWon = 0
        let p1PointsWon = 0
        let p2PointsWon = 0
        for (let i = 0; i < game.score.length; i++) {
            let round = game.score[i]
            let [score1, score2] = round.split('-')
            p1PointsWon += parseInt(score1)
            p2PointsWon += parseInt(score2)
            if (score1 > score2) {
                p1RoundsWon++;
            } else {
                p2RoundsWon++;
            }
        }
        player_one.rounds_won += p1RoundsWon;
        player_one.rounds_lost += p2RoundsWon;
        player_two.rounds_won += p2RoundsWon;
        player_two.rounds_lost += p1RoundsWon;
        player_one.points_won += p1PointsWon;
        player_one.points_lost += p2PointsWon;
        player_two.points_won += p2PointsWon;
        player_two.points_lost += p1PointsWon;
        delete player_one.label;
        delete player_one.name;
        delete player_one.game_history;
        delete player_one.value;
        delete player_one.id;
        delete player_two.label;
        delete player_two.name;
        delete player_two.game_history;
        delete player_two.value;
        delete player_two.id;
        return [player_one, player_two]
    }

    isDraw() {
        let playerOneWins = 0;
        let numRounds = this.numberOfRounds()
        for (let i = 0; i < numRounds; i++) {
            let [score1, score2] = this.state.score[i];
            if (score1 > score2) {
                playerOneWins++;
            }
        }
        return numRounds - playerOneWins === playerOneWins;
    }

    validFields() {
        let numRounds = this.numberOfRounds()
        try {
            if (!(this.state.playerOne && this.state.playerTwo) ||
                    !(this.state.playerOne.name && this.state.playerTwo.name)) {
                toastr.error("Invalid Player Names")
                return false;
            }
            for (let i = 0; i < numRounds; i++) {
                console.log(i)
                try {
                    let [score1, score2] = this.state.score[i]
                    if (score1 === "6" && score2 === "6") {
                        toastr.error("Both players can't win a round");
                        return false;
                    }
                    if (score1 !== "6" && score2 !== "6") {
                        toastr.error("Invalid scores: at least one score for each round must be 6")
                        return false;
                    }
                    if (score1 === "" || score2 === "") {
                        toastr.error("Invalid scores: both scores must have a value")
                        return false;
                    }
                } catch {
                    toastr.error(`Row ${i + 1} is missing a score`)
                    return false;
                }
            }
            if (this.isDraw()) {
                toastr.error(`Games can't result in a draw`)
                return false;
            }
        } catch (e) {
            toastr.error("Unhandled error when validating fields")
            return false;
        }
        return true;
    }

    formatScore() {
        let result = []
        let numRounds = this.numberOfRounds()
        for (let i = 0; i < numRounds; i++) {
            let round = `${this.state.score[i][0]}-${this.state.score[i][1]}`
            result.push(round)
        }
        return result
    }

    playerOneWins() {
        let victories = 0
        let losses = 0
        let numRounds = this.numberOfRounds()
        for (let i = 0; i < numRounds; i++) {
            this.state.score[i][0] > this.state.score[i][1] ? victories++ : losses++
        }
        return victories > losses;
    }

    updatePlayerOne(value) {
        this.setState({playerOne: value});
    }

    updatePlayerTwo(value) {
        this.setState({playerTwo: value});
    }

    numberOfRounds() {
        let score = this.state.score
        if (this.invalidScore(score[2])) {
            if (this.invalidScore(score[1])) {
                return 1
            }
            return 2
        }
        return 3
    }

    updateScore(event) {
        if (event.target.value === "") {
            let score = this.state.score
            score[event.target.tabIndex][parseInt(event.target.name)] = event.target.value
            this.setState({score: score})
        } else {
            try {
                let value = parseInt(event.target.value)
                if (value >= 0 && value <= 6) {
                    let score = this.state.score
                    score[event.target.tabIndex][parseInt(event.target.name)] = event.target.value
                    this.setState({score: score})
                }
            }
            catch (e) {
                toastr.error("Uncaught error when updating score")
            }
        }
    }

    invalidScore(score) {
        return score[0] === "" || score[1] === ""
    }

    render() {
        return (
            <div>
                <Form style={{padding: 100}}>
                    <Row className="mb-3">
                        <Form.Group as={Col}>
                            <Form.Label>Player One</Form.Label>
                            { this.state.players ?
                                    this.state.playerTwo ?
                                    <Select options={this.state.players.filter(player => player.name !== this.state.playerTwo.name)}
                                            key={this.state.players}
                                            value={this.state.value}
                                            onChange={(value) => {this.updatePlayerOne(value)
                                                this.setState({value: value})}}>
                                    </Select>
                                            :
                                    <Select options={this.state.players}
                                            key={this.state.players}
                                            value={this.state.value}
                                            onChange={(value) => {this.updatePlayerOne(value)
                                                this.setState({value: value})}}>
                                    </Select>
                                    : null
                            }
                        </Form.Group>
                        <Form.Group as={Col}>
                            <Form.Label>Player Two</Form.Label>
                            { this.state.players ?
                                    this.state.playerOne ?
                                    <Select options={this.state.players.filter(player => player.name !== this.state.playerOne.name)}
                                            key={this.state.players}
                                            value={this.state.value2}
                                            onChange={(value) => {this.updatePlayerTwo(value)
                                            this.setState({value2: value})}}>
                                    </Select>
                                            :
                                    <Select options={this.state.players}
                                            key={this.state.players}
                                            value={this.state.value2}
                                            onChange={(value) => {this.updatePlayerTwo(value)
                                                this.setState({value2: value})}}>
                                    </Select>
                                    : null
                            }
                        </Form.Group>
                    </Row>

                    <Form.Group className="mb-3" controlId="formPlayers">
                        <Form.Label>Scores:</Form.Label>
                        <Table>
                            <thead>
                            <tr>
                                <th>Round</th>
                                <th>{this.state.playerOne ? this.state.playerOne.name : "Player One"}</th>
                                <th>{this.state.playerTwo ? this.state.playerTwo.name : "Player Two"}</th>
                            </tr>
                            </thead>
                            <tbody>
                            { this.state.score.map((value, index) => {
                                let readOnly = index === 0 ? false : this.invalidScore(this.state.score[index - 1]);
                                return (
                                        <tr key={index} color={"#6c757d"}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <input readOnly={readOnly}
                                                       value={this.state.score[index][0]}
                                                       name="0"
                                                       tabIndex={index}
                                                       onChange={this.updateScore}/>
                                            </td>
                                            <td>
                                                <input readOnly={readOnly}
                                                       value={this.state.score[index][1]}
                                                       name="1"
                                                       tabIndex={index}
                                                       onChange={this.updateScore}/>
                                            </td>
                                        </tr>
                                )
                            })}
                            </tbody>
                        </Table>
                    </Form.Group>

                    <footer>
                        <a className="button" onClick={this.submit}>
                            Submit
                        </a>
                    </footer>
                </Form>
            </div>
        )
    }
}