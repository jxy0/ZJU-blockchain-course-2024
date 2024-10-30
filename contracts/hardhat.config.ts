import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
    solidity: "0.8.20",
    networks: {
        ganache: {
            // rpc url, change it according to your ganache configuration
            url: 'http://127.0.0.1:7545',
            // the private key of signers, change it according to your ganache user
            accounts: [
                '0x204bc8777fd521cf0f5783a9d94c38213bf065998caf8a44bd8ed61ba7f1331b',
                '0x2d33fad60dc732a297248c3583f0ddae89933bd46d58a1f3f046f2b879fec736',
                '0x3527648c1a4ea8fe4c388afaeddc665aeb23c460cd8f98a4e928b33598f344a5',
                '0x9c11d1c0984ec761256bf39347c2b2dbafaa8ffaae51303bf9104c008ced0379',
                '0xa87f678d184dbb4167c7a207007e750ffa487e8b0aeab9f8440835c672b6cdeb',
                '0x3c2e7f779bf3f269a2d3973967be4a685777559454cc1fac7f8b039a7682f162',
                '0x3a39f6c37c91a7db8492574c8ef891b370c1320c045de995af3a3db4238bb005',
                '0xcca88dbb825098ff97a96add38efa6691547e6746280e7e786acf03b892ea432',
                '0x5a482f5e0a6ac143544078d77dbbd279e79b12f977bb0919bb41fca7e51a86bf',
                '0xaf7ca7a05d789dada87781321542444ef1680328716c43182925e1d5c45d3493'
            ]
        },
    },
};

export default config;
