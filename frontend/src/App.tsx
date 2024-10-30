import React, {useEffect, useState} from 'react';
import {BuyMyRoomContract,RewardTokenContract, web3} from './utils/contracts';
import {Button, Card, Col, Input, Layout, List, message, Row, Typography} from 'antd';
import './App.css';
import { Numbers } from 'web3';

const {Header, Content} = Layout;
const {Text} = Typography;

function App() {
    type House = {
        owner: string;
        price: string;
        listedTimestamp: string;
        forSale: boolean;
    };

    const [account, setAccount] = useState<string | undefined>(undefined);
    const [houses, setHouses] = useState<any[]>([]);
    const [ownedHouses, setOwnedHouses] = useState<any[]>([]);
    const [balance, setBalance] = useState<string>('0');
    const [price, setPrice] = useState<string>('');
    const [tokenId, setTokenId] = useState<number | null>(null);
    const [claimStatus, setClaimStatus] = useState<string>(''); // 用于显示领取状态
    const [isClaiming, setIsClaiming] = useState<boolean>(false); // 控制领取按钮状态

    const [ethAmount, setEthAmount] = useState<string>(''); // 用于兑换积分的ETH数量
    const [pointsBalance, setPointsBalance] = useState<string>('0'); // 积分余额

    useEffect(() => {
        loadBlockchainData();
    }, []);

    const exchangeEthToPoints = async () => {
        if (!account || !ethAmount) return;
        try {
            await BuyMyRoomContract.methods.exchangeEthToPoints().send({
                from: account,
                value: web3.utils.toWei(ethAmount, 'ether')
            });
            message.success("Exchanged successfully!");
            loadBlockchainData();
        } catch (error) {
            console.error("Error in exchange:", error);
            message.error("Error in exchange.");
        }
    };

    const getHouseImage = (id: string) => {
        try {
            console.log(`/images/${id}.png`);
            return `/images/${id}.png`;
        } catch (e) {
            return `/images/default.png`;
        }
    };

    const loadBlockchainData = async () => {
        const accounts = await web3.eth.requestAccounts();
        setAccount(accounts[0]);

        // 获取用户的余额
        const userBalance = await web3.eth.getBalance(accounts[0]);
        setBalance(web3.utils.fromWei(userBalance, 'ether'));

        // 获取用户积分余额
        const points = await RewardTokenContract.methods.balanceOf(accounts[0]).call();
        if (points) { // 检查 points 是否有值
            setPointsBalance(web3.utils.fromWei(points.toString(), 'ether'));
        } else {
            setPointsBalance("0"); // 如果 points 为空或无效，则设置为 "0"
        }

        // 获取用户拥有的房屋
        const userOwnedHouseIds = await BuyMyRoomContract.methods.getOwnedHouses(accounts[0]).call();

        if (Array.isArray(userOwnedHouseIds)) {
            const ownedHousesData = await Promise.all(
                userOwnedHouseIds.map(async (id: number) => {
                    const house: House = await BuyMyRoomContract.methods.houses(id).call();

                    return {
                        id: id.toString(),
                        owner: house.owner,
                        price: house.price,
                        listedTimestamp: house.listedTimestamp,
                        forSale: house.forSale,
                    };
                })
            );
            setOwnedHouses(ownedHousesData);
        }

        // 获取所有挂牌房屋
        const listedHouses = await BuyMyRoomContract.methods.getAllListedHouses().call();
        if (Array.isArray(listedHouses)) {
            const housesData = await Promise.all(
                listedHouses.map(async (id: number) => {
                    const house: House = await BuyMyRoomContract.methods.houses(id).call();
                    return {
                        id: id.toString(),
                        owner: house.owner,
                        price: house.price,
                        listedTimestamp: house.listedTimestamp,
                        forSale: house.forSale,
                    };
                })
            );
            setHouses(housesData);
        }
    };
// 用户领取房屋NFT
    const claimHouse = async () => {
        if (!account) {
            setClaimStatus("Please connect your wallet first.");
            return;
        }

        setIsClaiming(true); // 禁用按钮
        setClaimStatus("Claiming your house NFT...");

        try {
            // 调用合约中的 claimHouse 方法
            await BuyMyRoomContract.methods.claimHouse().send({from: account});
            setClaimStatus("House NFT claimed successfully!");
            loadBlockchainData();
        } catch (error) {
            console.error("Error claiming house:", error);
            setClaimStatus("Error claiming house. You have already claimed your free house.");
        } finally {
            setIsClaiming(false); // 恢复按钮状态
        }
    };

    const listHouseForSale = async () => {
        if (tokenId === null || !price) return;

        try {
            await BuyMyRoomContract.methods.listHouse(tokenId, web3.utils.toWei(price, 'ether')).send({from: account});
            loadBlockchainData();
        } catch (error) {
            console.error("Error listing house:", error);
            message.error("Error listing house.");
        }
    };

    const buyHouse = async (id: number, housePrice: string) => {
        try {
            // 调用合约的 buyHouse 函数并传递正确的 value 参数
            await BuyMyRoomContract.methods.buyHouse(id).send({from: account, value: housePrice, gas: String(3000000)});
            // 成功后重新加载区块链数据
            loadBlockchainData();
        } catch (error) {
            console.error("Error buying house:", error);
            message.error("Error buying house. Please try again.");
        }
    };

    const buyHouseWithPoints = async (id: number, price: string) => {
        console.log(price);
        const priceInPoints = String(BigInt(price)*BigInt(100));
        console.log(priceInPoints);
        try {
            await BuyMyRoomContract.methods.buyHouseWithPoints(id, priceInPoints).send({ from: account });
            loadBlockchainData();
        } catch (error) {
            message.error("Error buying house with points.");
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ backgroundColor: '#001529', padding: '20px', textAlign: 'center' }}>
                <Text style={{ color: '#fff', fontSize: '28px', fontWeight: 'bold' }}>
                    Decentralized House Marketplace
                </Text>
            </Header>
            <Content style={{ padding: '30px' }}>
                <Row gutter={[32, 32]}>
                    <Col xs={24} md={12}>
                        <Card title="Account Information" bordered={false}>
                            <p><Text strong>Connected account:</Text> {account}</p>
                            <p><Text strong>ETH Balance:</Text> {balance} ETH</p>
                            <p><Text strong>Points Balance:</Text> {pointsBalance} PTS</p>
                        </Card>
                        <Card title="Claim Your Free House NFT" bordered={false} style={{ marginTop: '20px' }}>
                            <Button type="primary" onClick={claimHouse} loading={isClaiming} disabled={!account}>
                                Claim House
                            </Button>
                            {claimStatus && <p style={{ marginTop: '10px' }}>{claimStatus}</p>}
                        </Card>
                        <Card title="Exchange ETH for Points" bordered={false} style={{ marginTop: '20px' }}>
                            <Input
                                placeholder="Amount of ETH"
                                type="number"
                                value={ethAmount}
                                onChange={(e) => setEthAmount(e.target.value)}
                                style={{ marginBottom: '14px' }}
                            />
                            <Button type="primary" onClick={exchangeEthToPoints}>Exchange</Button>
                        </Card>
                    </Col>

                    <Col xs={24} md={12}>
                        <Card title="Your Owned Houses" bordered={false}>
                            <List
                                dataSource={ownedHouses}
                                renderItem={(house) => (
                                    <List.Item>
                                        <img src={getHouseImage(house.id)} alt={`House ${house.id}`} style={{ width: '80px', height: '80px', marginRight: '16px' }} />
                                        <div>
                                            <Text>House ID: {house.id}</Text>
                                            <br />
                                            <Text>Status: {house.forSale ? "Listed for Sale" : "Not for Sale"}</Text>
                                        </div>
                                    </List.Item>
                                )}
                                locale={{ emptyText: "You don't own any houses yet." }}
                            />
                        </Card>
                        <Card title="List Your House for Sale" bordered={false} style={{ marginTop: '20px' }}>
                            <Input
                                placeholder="Token ID"
                                type="number"
                                value={tokenId !== null ? tokenId : ''}
                                onChange={(e) => setTokenId(Number(e.target.value))}
                                style={{ marginBottom: '14px' }}
                            />
                            <Input
                                placeholder="Price in ETH"
                                type="text"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                style={{ marginBottom: '14px' }}
                            />
                            <Button type="primary" onClick={listHouseForSale}>List House</Button>
                        </Card>
                    </Col>

                    <Col xs={24} md={12}>
                        <Card title="Available Houses for Sale" bordered={false}>
                            <List
                                dataSource={houses}
                                renderItem={(house) => (
                                    <List.Item actions={[
                                        <Button type="link" onClick={() => buyHouse(house.id, house.price)}>Buy with ETH</Button>,
                                        <Button type="link" onClick={() => buyHouseWithPoints(house.id, house.price)}>Buy with Points</Button>
                                    ]}>
                                        <img src={getHouseImage(house.id)} alt={`House ${house.id}`} style={{ width: '80px', height: '80px', marginRight: '16px' }} />
                                        <div>
                                            <Text>House ID: {house.id}</Text>
                                            <br />
                                            <Text>Owner: {house.owner}</Text>
                                            <br />
                                            <Text>Price: {web3.utils.fromWei(house.price, 'ether')} ETH</Text>
                                        </div>
                                    </List.Item>
                                )}
                                locale={{ emptyText: "No houses available for sale." }}
                            />
                        </Card>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}

export default App;
