import React from "react";
import {Navbar, Container, Nav} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.css';
import "toastr/toastr.scss";
import Logo from '../../ihateyou.jpeg';


export class NavBar extends React.Component {

    constructor(props) {
        super(props);
        this.state = {environment : null};
    }

    getHost() {
        if (process.env.NODE_ENV !== 'development') {
            return "https://haxboard.vercel.app/#"
        } else {
            return ""
        }
    }

    render() {
        return (
            <div>
                <Navbar bg="dark" variant="dark" expand="lg" >
                    <Container>
                        <Navbar.Brand  href={`${this.getHost()}/`}>
                            <img height={60} width={50} className="img-responsive" src={Logo} alt="" style={{paddingBottom: '0%'}}/>
                        </Navbar.Brand>
                        <Nav className="me-auto">
                            <Nav.Link draggable={false} href={`${this.getHost()}/stats`}>Player Stats</Nav.Link>
                            <Nav.Link draggable={false} href={`${this.getHost()}/`}>Game History</Nav.Link>
                            <Nav.Link draggable={false} href={`${this.getHost()}/record`}>Record Results</Nav.Link>
                            <Nav.Link draggable={false} href={`${this.getHost()}/compare`}>Detailed Comparison</Nav.Link>
                            <Nav.Link draggable={false} href={`${this.getHost()}/trophies`}>Trophies</Nav.Link>
                        </Nav>
                    </Container>
                </Navbar>
            </div>
        )
    }
}

