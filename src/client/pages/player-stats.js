import React from "react";
import {getPlayers} from "../services/api";
import {DataGrid, GridLoadingOverlay} from '@mui/x-data-grid';
import {Form} from "react-bootstrap";
import toastr from "toastr";
import {Avatar} from "@mui/material";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCrown} from "@fortawesome/free-solid-svg-icons";


export class PlayerStats extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            games: [],
            players: [],
            columns: [
                { field: 'avatar', headerName: '', width: 70, sortingOrder: ['desc', 'asc'],
                    renderCell: (params, other) => {
                        return (
                            <>
                                <div>
                                {params.api.getRowIndex(params.row.id) === 0 ?
                                    <FontAwesomeIcon icon={faCrown}
                                                     style={{
                                                         color: "#f8f135",
                                                         paddingLeft: 12,
                                                         paddingTop: 0,
                                                         position: 'absolute',
                                                         opacity: 1,
                                                         zIndex: 1
                                                     }} /> : null }
                                    <Avatar src={`${params.row.name.toLowerCase()}.png`} />

                                </div>
                            </>
                        );
                    }
                },
                { field: 'name', headerName: 'Name', width: 130, sortingOrder: ['desc', 'asc'] },
                { field: 'elo', headerName: 'Elo', width: 100, sortingOrder: ['desc', 'asc'] },
                {
                    field: 'wlr',
                    headerName: 'Win/Loss Ratio',
                    width: 150,
                    valueGetter: (params) =>
                            `${this.getWinLossRatio(params.row.games_won, params.row.games_played)}%`,
                    sortComparator: this.percentageComparator,
                    sortingOrder: ['desc', 'asc']
                },
                { field: 'games_played', headerName: 'Played', width: 100, sortingOrder: ['desc', 'asc'] },
                { field: 'games_won', headerName: 'Won', width: 100, sortingOrder: ['desc', 'asc'] },
                { field: 'goals', headerName: 'Goals', width: 100, sortingOrder: ['desc', 'asc'] },
                { field: 'assists', headerName: 'Assists', width: 100, sortingOrder: ['desc', 'asc'] },
                { field: 'kicks', headerName: 'Kicks', width: 100, sortingOrder: ['desc', 'asc'] },
                { field: 'passes', headerName: 'Passes', width: 100, sortingOrder: ['desc', 'asc'] },
                { field: 'own_goals', headerName: 'Own Goals', width: 100, sortingOrder: ['desc', 'asc'] },
                { field: 'shots_on_goal', headerName: 'Shots on Goal', width: 120, sortingOrder: ['desc', 'asc'] },
            ]
        }
    }

    percentageComparator = (v1, v2) => parseInt(v1.split('.')[0]) - parseInt(v2.split('.')[0])

    componentDidMount() {
        getPlayers().then((res) => {
            this.setState({ players: res.data });
        }).catch((err) => {
            toastr.error("Server error when getting player stats")
        })
    }

    getWinLossRatio(won, played) {
        let wlr = 0
        if (won !== 0) {
            wlr = (100 * won) / (played)
        }
        return wlr.toFixed(2)
    }

    render() {
        return (
            <Form style={{paddingLeft: '10%', paddingRight: '10%', paddingTop: '7%', paddingBottom: '25%'}}>
                {   this.state.players ?
                    <div style={{height: 525, width: '100%'}}>
                        <DataGrid
                            rows={this.state.players}
                            columns={this.state.columns}
                            pageSize={10}
                            components={{
                                NoRowsOverlay: GridLoadingOverlay
                            }}
                            sx={{
                                boxShadow: 10,
                                "& .MuiDataGrid-main":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                                "& .MuiDataGrid-footerComponent":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                                "& .MuiDataGrid-footerContainer":  { backgroundColor: "rgba(250, 250, 250, .3)" },
                            }}
                            sortingOrder={['asc', 'desc']}
                            rowsPerPageOptions={[10]}
                            initialState={{
                                sorting: {
                                    sortModel: [{ field: 'elo', sort: 'desc' }],
                                },
                            }}
                        />
                    </div> :
                        null}
            </Form>
        )
    }
}