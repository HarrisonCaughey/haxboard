import React from "react";
import {Form} from "react-bootstrap";
import {getGames, getPlayers, updatePlayer} from "../services/api";
import { DataGrid } from '@mui/x-data-grid';
import { GridLoadingOverlay } from "@mui/x-data-grid";
import {Button} from "@mui/material";
import toastr from "toastr";
import $ from "jquery";


export class GameHistory extends React.Component {

    constructor(props) {
        super(props);
        this.openConfirmModal = this.openConfirmModal.bind(this)
        this.getTeamNames = this.getTeamNames.bind(this)
        this.handleClick = this.handleClick.bind(this)

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

    openConfirmModal() {
        $('#confirmModal').addClass('is-active');
    }

    handleClick() {
        return null
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
                {<ConfirmModal handleClick={this.handleClick}/>}
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
        this.props.handleClick()
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