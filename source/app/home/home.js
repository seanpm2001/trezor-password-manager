/*
 * Copyright (c) Peter Jensen, SatoshiLabs
 *
 * Licensed under Microsoft Reference Source License (Ms-RSL)
 * see LICENSE.md file for details
 */

'use strict';

var React = require('react'),
    Router = require('react-router'),
    Store = require('../global_components/data_store'),
    Footer = require('../global_components/footer/footer'),
    PinDialog = require('../global_components/pin_dialog/pin_dialog'),
    {Link} = Router,
    Home = React.createClass({
        mixins: [Router.Navigation],

        getInitialState() {
            return {
                trezorReady: false,
                storageReady: false,
                username: '',
                storageType: 'DROPBOX',
                deviceStatus: 'disconnected',
                dialog: 'preloading',
                loadingText: 'Waking up ...'
            }
        },

        componentDidMount() {
            chrome.runtime.onMessage.addListener(this.chromeMsgHandler);
            // RUN INIT!
            this.sendMessage('initPlease');
        },

        componentWillUnmount() {
            chrome.runtime.onMessage.removeListener(this.chromeMsgHandler);
        },

        chromeMsgHandler(request, sender, sendResponse) {
            switch (request.type) {

                // STORAGE PHASE

                case 'initialized':
                    this.setState({
                        dialog: 'connect_storage',
                        storageReady: true
                    });
                    break;

                case 'setUsername':
                    this.setState({
                        dialog: 'accept_user',
                        username: request.content.username,
                        storageType: request.content.storageType
                    });
                    //this.initTrezorPhase();
                    break;

                case 'disconnected':
                    this.setState({
                        dialog: 'connect_storage',
                        username: '',
                        storageType: '',
                        storageReady: false
                    });
                    break;

                // TREZOR PHASE

                case 'showPinDialog':
                    this.setState({
                        dialog: 'pin_dialog'
                    });
                    chrome.tabs.getCurrent((tab) => {
                        sendResponse({type:'pinVisible', tab: tab});
                    });
                    break;

                case 'trezorPin':
                    this.setState({
                        dialog: 'loading_dialog'
                    });
                    break;

                case 'loading':
                    this.setState({
                        dialog: 'loading_dialog',
                        loadingText: request.content
                    });
                    break;

                case 'showButtonDialog':
                    this.setState({
                        dialog: 'button_dialog'
                    });
                    break;

                case 'trezorDisconnected':
                    this.setState({
                        trezorReady: false,
                        dialog: 'connect_trezor'
                    });
                    break;

                case 'decryptedContent':
                    window.myStore = new Store(request.content, this.state.username, this.state.storageType);

                    this.transitionTo('dashboard');
                    break;
            }
            return true;
        },

        sendMessage(msgType, msgContent) {
            chrome.runtime.sendMessage({type: msgType, content: msgContent});
        },

        connectDropbox() {
            this.setState({
                dialog: 'preloading'
            });
            this.sendMessage('connectDropbox');
        },

        connectDrive() {
            this.setState({
                dialog: 'preloading'
            });
            this.sendMessage('connectDrive');
        },

        disconnect() {
            this.sendMessage('disconnect');
        },

        initTrezorPhase() {
            this.sendMessage('initTrezorPhase');
        },

        checkStates() {
            if (this.state.trezorReady && this.state.storageReady) {
                this.transitionTo('dashboard');
            }
        },

        restartBackground() {
            chrome.runtime.reload();
        },

        render() {
            return (
                <div>
                    <div className='overlay-hill'></div>
                    <div className='overlay-color'></div>
                    <div className='home'>

                        <div className={this.state.dialog === 'connect_storage' ? 'connect_storage' : 'hidden_dialog'}>
                            <img src='dist/app-images/trezor.svg' className='no-circle'/>

                            <div className='dialog-content'>
                                <h1><b></b>Password Manager</h1>
                                <button className='dropbox-login' onClick={this.connectDropbox}>Sign in with Dropbox
                                </button>
                                <br />
                                <button className='drive-login' onClick={this.connectDrive}>Sign in with Drive
                                </button>
                            </div>
                        </div>

                        <div className={this.state.dialog === 'preloading' ? 'preloading' : 'hidden_dialog'}>
                            <img src='dist/app-images/trezor.svg' className='no-circle'/>

                            <div className='dialog-content'>
                                <h1><b></b>Password Manager</h1>
                                <span className='spinner'></span>
                            </div>
                        </div>

                        <div
                            className={this.state.dialog === 'accept_user' ? 'accept_user' : 'hidden_dialog'}>
                            <img src={'dist/app-images/' + this.state.storageType.toLowerCase() + '.svg'} />

                            <div>
                                <button onClick={this.initTrezorPhase} className='accept-btn'>Continue as
                                    <b> {this.state.username}</b>
                                </button>
                                <br />
                                <button className='no-style' onClick={this.disconnect}>Use different
                                    account or service.
                                </button>
                                {this.state.storageType === 'DROPBOX' ? <i>(Manage your accounts via Dropbox.com)</i> : <i>(Manage your accounts via browser settings)</i>}
                            </div>
                        </div>

                        <div className={this.state.dialog === 'connect_trezor' ? 'connect_trezor' : 'hidden_dialog'}>
                            <img src='dist/app-images/trezor_connect.png'/>

                            <h1>Connect your <br/> <b className='smallcaps'>TREZOR</b> device.</h1>
                            <br />
                            <button className='no-style'><a href='https://www.buytrezor.com?a=tpm' target='_blank'>I don't
                                have a TREZOR device.</a></button>
                        </div>

                        <div className={this.state.dialog === 'pin_dialog' ? 'pin_dialog' : 'hidden_dialog'}>
                            <PinDialog />
                        </div>

                        <div className={this.state.dialog === 'loading_dialog' ? 'loading_dialog' : 'hidden_dialog'}>
                            <span className='spinner'></span>

                            <h1>{this.state.loadingText}</h1>
                        </div>

                        <div className={this.state.dialog === 'button_dialog' ? 'button_dialog' : 'hidden_dialog'}>
                            <img src='dist/app-images/trezor_button.png'/>

                            <h1>Follow instructions on your <br/> <b className='smallcaps'>TREZOR</b> device.</h1>
                        </div>

                        <Footer footerStyle='white'/>
                    </div>
                </div>
            )
        }
    });

module.exports = Home;
