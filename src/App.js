import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import * as LottiePlayer from "@lottiefiles/lottie-player";
import Countdown, { zeroPad } from 'react-countdown';
import './App.css';
import './assets/walletButton.scss'
import abi from './utils/WavePortal.json'

export default function App() {

  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [waitWave, setWaitWave] = useState(false)
  const [successWave, setSuccessWave] = useState(false)
  const [message, setMessage] = useState('')

  const contractAddress = "0x21f2412263AD1824bf5aEF6a01eFC2a1709Ed2eA";

  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        getAllWaves();
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get Metamask!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllWaves();
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        setWaitWave(true)
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        setWaitWave(false)
        setSuccessWave(true)
        console.log("Mined --", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        await setTimeout(() => { setSuccessWave(false) }, 3000)
        localStorage.setItem('timestamp', Date.now())
        getAllWaves();
        document.location.reload()
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setWaitWave(false)
      setSuccessWave(false)
      console.log(error)
    }
  }

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        console.log(wavePortalContract)
        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  function copyToClipBoard() {
    var x = document.getElementById("snackbar");
    x.className = "show";
    setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
  }

  function handleChange(event) {
    setMessage(event.target.value)
  }

  const renderer = ({ hours, minutes, seconds, completed }) => {
    if (completed) {
      return <div className='flex'>
        {currentAccount &&
          <>
            {waitWave ? (
              <button className="connectButton m-0 mt-10">
                <lottie-player
                  autoplay
                  loop
                  mode="normal"
                  src="https://assets9.lottiefiles.com/packages/lf20_Xho5ht.json"
                  style={{ width: '70px', height: '70px' }}
                />
              </button>
            ) : successWave ? (
              <button className="connectButton m-0 mt-10">
                <lottie-player
                  autoplay
                  mode="normal"
                  src="https://assets7.lottiefiles.com/packages/lf20_iwiqh5bd.json"
                  style={{ width: '70px', height: '70px' }}
                />
              </button>
            ) : (
              <button className="connectButton m-0 mt-10" onClick={wave}>
                Wave at Me
              </button>
            )}
          </>
        }
      </div>
    } else {
      // Render a countdown
      return <div className="text-center timecounter mt-10">{zeroPad(minutes)}:{zeroPad(seconds)}</div>;
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <>
      <div className='flex header flex-end'>
        {!currentAccount ? (
          <button className="connectButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <div className="flex">
            <button className="connectButton" onClick={() => {
              navigator.clipboard.writeText(currentAccount)
              copyToClipBoard()
            }}>
              {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
            </button>
            <div id="snackbar">Copied</div>
          </div>
        )}
      </div>
      <div className='directflex height-100 mobile-height-auto'>
        <div className="mainContainer">

          <div className="dataContainer">
            <div className="header">
              👋 Hey! I&apos;m Adan.
            </div>

            {currentAccount && (
              <div className="flex">
                <lottie-player
                  autoplay
                  loop
                  mode="normal"
                  src="https://assets10.lottiefiles.com/packages/lf20_85jUo8.json"
                  class='animation'
                />
              </div>
            )}

            {!currentAccount &&
              <>
                <div className="bio">
                  Connect Your Wallet!
                </div>
                <div className="flex mt-10">
                  <lottie-player
                    autoplay
                    loop
                    mode="normal"
                    src="https://assets3.lottiefiles.com/packages/lf20_xUyFWi.json"
                    class='animation'
                  />
                </div>
              </>
            }

            {currentAccount && (
              <textarea className="waveInput mt-20" rows='4' onChange={() => handleChange(event)}></textarea>
            )}
            <div className="text-center mt-10">
              You will get 0.01ETH when you wave at me.<br />
              Is it too small? 50% chance to get 2x!!!
            </div>
            <Countdown date={Number(localStorage.getItem('timestamp')) ? (Number(localStorage.getItem('timestamp')) + 60000) : (Date.now() + 1)} renderer={renderer} />
          </div>
        </div>
        {currentAccount && <div className={allWaves[0] ? "height-20 messageGroup" : "height-20 messageGroup m-0 p-0"}>
          <div className="directflex">
            {allWaves[0] ?
              (
                allWaves.map((wave, index) => {
                  return (
                    <div key={index} className="messageSection">
                      <div>Address: {wave.address}</div>
                      <div>Message: {wave.message}</div>
                    </div>
                  )
                })
              ) : (
                <div className="p-20">
                  No History!
                </div>
              )}
          </div>
        </div>}
      </div>
    </>
  );
}
