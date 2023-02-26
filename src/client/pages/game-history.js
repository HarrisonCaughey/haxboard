import React from "react";
import {Form} from "react-bootstrap";
import {getGames, deleteGame, getPlayers, updatePlayer} from "../services/api";
import { DataGrid } from '@mui/x-data-grid';
import { GridLoadingOverlay } from "@mui/x-data-grid";
import {Button} from "@mui/material";
import toastr from "toastr";
import $ from "jquery";


export class GameHistory extends React.Component {

    constructor(props) {
        super(props);
        this.deleteGame = this.deleteGame.bind(this)
        this.getPlayerStats = this.getPlayerStats.bind(this)
        this.openConfirmModal = this.openConfirmModal.bind(this)
        this.getTeamNames = this.getTeamNames.bind(this)

        this.state = {
            games: [],
            players: null,
            columns: [
                { field: 'date', headerName: 'Date', width: 100, sortable: true },
                { field: 'game_time', headerName: 'Length', width: 70, sortable: true },
                {
                    field: 'winners',
                    headerName: 'Winners',
                    width: 70,
                    sortable: false,
                    valueGetter: (params) =>
                        `${params.row.red_score > params.row.blue_score ? "Red" : "Blue"}`,
                },
                {
                    field: 'red_team_names',
                    headerName: 'Red Team',
                    width: 200,
                    sortable: false,
                    valueGetter: (params) =>
                        `${this.getTeamNames(params.row.red_team)}`,
                },
                {
                    field: 'blue_team_names',
                    headerName: 'Blue Team',
                    width: 200,
                    sortable: false,
                    valueGetter: (params) =>
                        `${this.getTeamNames(params.row.blue_team)}`,
                },
                { field: 'red_possession', headerName: 'R%', width: 40, sortable: true },
                { field: 'red_score', headerName: 'R', width: 20, sortable: false },
                { field: 'blue_score', headerName: 'B', width: 20, sortable: false },
                { field: 'blue_possession', headerName: 'B%', width: 40, sortable: true },
            ]
        }
    }

    componentDidMount() {
        getPlayers().then((players) => {
            this.setState({ players: players.data });
            getGames().then(res => {
                let games = res.data
                games.forEach((game) => {
                    game.date = game.date.slice(0, 10)
                    game.game_time = this.parseTime(game.game_time)
                })

                this.setState({ games: games });
            })
        })

    }

    getTeamNames(members) {
        let names = ''
        for (let i of members) {
            names += this.state.players.filter(player => player.id === i)[0].name + ', '
        }
        return names.slice(0, -2)
    }

    parseTime(gt) {
        var mins = Math.floor(gt / 60);
        gt -= mins * 60;
        if (gt < 10) gt = "0" + gt;
        return "" + mins + ":" + gt;
    }


    deleteGame() {
        let params = this.state.selectedRow
        let id = params.id
        let game = params.row
        try {
            deleteGame(id).then((res) => {
                if (res.status === 500) {
                    toastr.error("Server error when deleting game")
                    return
                }
                // Update player info
                let [player_one, player_two] = this.getPlayerStats(game);
                let p1_id = player_one.id
                let p2_id = player_two.id
                delete player_one.id
                delete player_two.id;
                updatePlayer(player_one, p1_id).then(() => {
                    updatePlayer(player_two, p2_id).then(() => {
                        let games = this.state.games.filter(game => game.id !== id)
                        this.setState({games: games})
                        toastr.success("Game successfully deleted")
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

    getPlayerStats(game) {
        let player_one = structuredClone(this.state.players.filter(player => player.id === game.player_one)[0])
        let player_two = structuredClone(this.state.players.filter(player => player.id === game.player_two)[0])
        if (game.player_one_win) {
            player_one.games_won--
            player_two.games_lost--
        } else {
            player_two.games_won--
            player_one.games_lost--
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
        player_one.rounds_won -= p1RoundsWon;
        player_one.rounds_lost -= p2RoundsWon;
        player_two.rounds_won -= p2RoundsWon;
        player_two.rounds_lost -= p1RoundsWon;
        player_one.points_won -= p1PointsWon;
        player_one.points_lost -= p2PointsWon;
        player_two.points_won -= p2PointsWon;
        player_two.points_lost -= p1PointsWon;
        delete player_one.label;
        delete player_one.name;
        delete player_one.game_history;
        delete player_one.value;
        delete player_one.elo
        delete player_two.label;
        delete player_two.name;
        delete player_two.game_history;
        delete player_two.value;
        delete player_two.elo
        return [player_one, player_two]
    }

    openConfirmModal() {
        $('#confirmModal').addClass('is-active');
    }

    render() {
        return (
            <div>
                <Form style={{paddingLeft: '15%', paddingRight: '15%', paddingTop: '7%', paddingBottom: '10%'}}>
                    {   this.state.games ?
                        <div style={{height: 650, width: '100%'}}>
                        <DataGrid
                                rows={this.state.games}
                                columns={this.state.columns}
                                pageSize={10}
                                rowsPerPageOptions={[10]}
                                sx={{
                                    boxShadow: 10,
                                    "& .MuiDataGrid-main":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                                    "& .MuiDataGrid-footerComponent":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                                    "& .css-17jjc08-MuiDataGrid-footerContainer":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                                }}
                                components={{
                                    NoRowsOverlay: GridLoadingOverlay
                                }}
                                initialState={{
                                    sorting: {
                                        sortModel: [{ field: 'date', sort: 'desc' }],
                                    },
                                }}
                        />
                    </div> : null}
                </Form>
                {<ConfirmModal handleDelete={this.deleteGame}/>}
            </div>
        )
    }
}


class ConfirmModal extends React.Component {

    constructor(props) {
        super(props);
        this.closeModal = this.closeModal.bind(this);
        this.confirm = this.confirm.bind(this);
    }

    confirm() {
        this.props.handleDelete()
        this.closeModal()
    }

    closeModal() {
        $('#confirmModal').removeClass('is-active');
    }

    render() {
        return (<div id="confirmModal" className="modal">
            <div className="modal-background"/>
            <div className="modal-card">
                <header className="modal-card-head">
                    <p className="modal-card-title">Confirmation</p>
                </header>
                <section className="modal-card-body">
                    <p>Are you sure that you want to delete this game?</p>
                </section>
                <footer className="modal-card-foot">
                    <a className="button is-warning" onClick={this.confirm}>Yes</a>
                    <a className="button" onClick={this.closeModal}>No</a>
                </footer>
            </div>
        </div>);
    }
}