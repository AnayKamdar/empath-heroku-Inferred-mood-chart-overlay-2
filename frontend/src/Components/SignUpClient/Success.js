import React from "react";
import { Button, Container, Row, Col, Card } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Success = () => {
    const location = useLocation();

    const handleContinue = () => {
        window.location.href = 'https://apps.apple.com/us/app/myempath/id6472873287'; 
    };

    const isExistingUser = location.search.includes("existing=true");

    return (
        <Container className="mt-5">
            <Row className="justify-content-md-center">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-center">{isExistingUser ? 
                                    "You have successfully linked your account" :
                                    "Account Created Successfully"
                                }</Card.Title>
                            <Card.Text className="text-center mt-4">
                                {isExistingUser ? 
                                    "Your account has been successfully linked. You can continue accessing the mobile app using your existing credentials." :
                                    "Your account has been successfully created. You can now continue signing into the mobile app using these credentials."
                                }
                            </Card.Text>
                            <div className="d-flex justify-content-center">
                                <Button variant="primary" onClick={handleContinue}>
                                    Download Mobile App
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Success;
