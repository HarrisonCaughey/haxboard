import React from "react";
import {getGames, getPlayers} from "../services/api";
import {DataGrid, GridLoadingOverlay} from '@mui/x-data-grid';
import {Form} from "react-bootstrap";
import {ELO_VOLATILITY} from "../constants/pages";


export class PlayerStats extends React.Component {

    constructor(props) {
        super(props);
        this.calculatePlayerElo = this.calculatePlayerElo.bind(this)
        this.state = {
            games: [],
            players: null,
            columns: [
                { field: 'name', headerName: 'Name', width: 150 },
                { field: 'elo', headerName: 'ELO', width: 100 },
                {
                    field: 'wlr',
                    headerName: 'Win/Loss Ratio',
                    width: 150,
                    valueGetter: (params) =>
                            `${this.getWinLossRational(params.row.games_won, params.row.games_lost)}%`,
                    sortComparator: this.percentageComparator,
                },
                {
                    field: 'round_wlr',
                    headerName: 'Rounds WLR',
                    width: 150,
                    valueGetter: (params) =>
                            `${this.getWinLossRational(params.row.rounds_won, params.row.rounds_lost)}%`,
                    sortComparator: this.percentageComparator,
                },
                {
                    field: 'point_wlr',
                    headerName: 'Points WLR',
                    width: 150,
                    valueGetter: (params) =>
                            `${this.getWinLossRational(params.row.points_won, params.row.points_lost)}%`,
                    sortComparator: this.percentageComparator,
                },
                { field: 'games_won', headerName: 'Wins', width: 100 },
                { field: 'games_lost', headerName: 'Losses', width: 100 },
                {
                    field: 'games_played',
                    headerName: 'Games Played',
                    width: 140,
                    valueGetter: (params) => params.row.games_won + params.row.games_lost
                },
                { field: 'points_won', headerName: 'Points Won', width: 100 },
                { field: 'points_lost', headerName: 'Points Lost', width: 100 },
                { field: 'rounds_won', headerName: 'Rounds Won', width: 100 },
                { field: 'rounds_lost', headerName: 'Rounds Lost', width: 100 },
            ]
        }
    }

    percentageComparator = (v1, v2) => parseInt(v1.split('.')[0]) - parseInt(v2.split('.')[0])

    componentDidMount() {
        getPlayers().then((res) => {
            this.setState({ players: res.data });
            getGames().then((res) => {
                this.calculatePlayerElo(res.data)
            })
        })
    }

    calculatePlayerElo(games) {
        let players = this.state.players
        players.map(player => player.elo = 1000)
        for (let game of games) {
            let p1 = players.filter(player => player.id === game.player_one)[0]
            let p2 = players.filter(player => player.id === game.player_two)[0]
            let r1 = Math.pow(10, p1.elo / 400)
            let r2 = Math.pow(10, p2.elo / 400)
            let e1 = r1 / (r1 + r2)
            let e2 = r2 / (r2 + r1)
            if (game.player_one_win) {
                p1.elo = parseInt(p1.elo + ELO_VOLATILITY * (1 - e1))
                p2.elo = parseInt(p2.elo + ELO_VOLATILITY * (0 - e2))
            } else {
                p1.elo = parseInt(p1.elo + ELO_VOLATILITY * (0 - e1))
                p2.elo = parseInt(p2.elo + ELO_VOLATILITY * (1 - e2))
            }
            players.map(player => player.id === p1.id ? p1 : player)
            players.map(player => player.id === p2.id ? p2 : player)
        }
        this.setState({players: players})
    }

    getWinLossRational(won, lost) {
        let wlr = 0
        if (won !== 0) {
            wlr = (100 * won) / (won + lost)
        }
        return wlr.toFixed(2)
    }

    render() {
        return (
            <Form style={{paddingLeft: '10%', paddingRight: '10%', paddingTop: '5%'}}>
                <Form.Label>Scoreboard:</Form.Label>
                {   this.state.players && this.state.players.length !== 0 && this.state.players[0].elo ?
                    <div style={{height: 450, width: '100%'}}>
                        <DataGrid
                            rows={this.state.players}
                            columns={this.state.columns}
                            pageSize={6}
                            components={{
                                NoRowsOverlay: GridLoadingOverlay
                            }}
                            sortingOrder={['asc', 'desc']}
                            rowsPerPageOptions={[6]}
                            initialState={{
                                sorting: {
                                    sortModel: [{ field: 'elo', sort: 'desc' }],
                                },
                            }}
                        />
                    </div> :
                        <div style={{height: 450, width: '100%'}}>
                            <DataGrid
                                    rows={[]}
                                    columns={this.state.columns}
                                    pageSize={6}
                                    components={{
                                        NoRowsOverlay: GridLoadingOverlay
                                    }}
                                    rowsPerPageOptions={[6]}
                            />
                        </div>}
            </Form>
        )
    }
}