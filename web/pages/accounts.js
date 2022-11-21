import Head from 'next/head'
import Link from 'next/link' 
import styles from '../styles/index.module.css';
import { useEffect, useState } from 'react';
import { UserOutlined, EyeInvisibleOutlined, EyeTwoTone, LoadingOutlined } from '@ant-design/icons';
import { Button, Input, Col, Row, Select, Alert, message, Table, Modal } from 'antd';
import { useRouter } from 'next/router';
import FooterMain from '../components/footer_main';
import NavMain from '../components/nav_main';
import NavSide from '../components/nav_side';
import LoadingMain from '../components/loading_main';
import HeaderMain from '../components/header_main';
import apis from '../manager/apis';

export default function Accounts() {
  const defaultUserData = {
    "id": null,
    "name": null,
    "mobile": null,
    "type": null,
    "email": null
  }
  const [signinState, setSigninState] = useState(null);
  const [siteToken, setSiteToken] = useState();
  const [tableData, setTableData] = useState([]);
  const [userData, setUserData] = useState(defaultUserData);
  const [modalPage, setModalPage] = useState('ข้อมูลผู้ใช้งาน');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isBtnViewLoading, setIsBtnViewLoading] = useState(false);

  const modalFooterMode = {
    'ข้อมูลผู้ใช้งาน': [
      <Button key="cancelEdit" onClick={clickCancel}>
        ยกเลิก
      </Button>,
      <Button key="removeUser" type="primary" danger onClick={clickRemoveUser}>
        ลบผู้ใช้งาน
      </Button>
    ],
    'เพิ่มผู้ใช้งาน': [
      <Button key="cancelEdit" onClick={clickCancel}>
        ยกเลิก
      </Button>,
      <Button key="removeUser" type="primary" primary onClick={clickAddUser}>
        เพิ่มผู้ใช้งาน
      </Button>
    ]
  }

  const { Option } = Select;

  const router = useRouter();

  async function clickView(e) {
    setModalPage("ข้อมูลผู้ใช้งาน")
    setIsBtnViewLoading(true)
    await apis.user(e.id).then((res) => { 
      setUserData(res) 
      setIsModalOpen(true)
    });
    setIsBtnViewLoading(false)
  }

  const tableColumns = [
    {
      title: 'ชื่อ',
      dataIndex: 'name',
      sorter: (a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)
    },
    {
      title: 'ประเภท',
      dataIndex: 'type',
      width: 300,
      filters: [
        {
          text: 'เภสัชกร',
          value: 'เภสัชกร',
        },
        {
          text: 'เจ้าหน้าที่',
          value: 'เจ้าหน้าที่',
        },
      ],
      onFilter: (value, record) => record.type.indexOf(value) === 0,
    },
    {
      title: '',
      dataIndex: '',
      key: 'x',
      width: 100,
      render: (_, record) => <Button loading={isBtnViewLoading} onClick={() => clickView(record)}>View</Button>,
    }
  ];

  async function clickAdd() {
    setUserData((prev) => ({...prev, "type":"pharmacy"}))
    setModalPage("เพิ่มผู้ใช้งาน");
    setIsModalOpen(true);
  }

  function clickCancel() {
    setUserData(defaultUserData);
    setIsModalOpen(false);
  }

  async function clickRemoveUser() {
    setIsModalLoading(true)
    let res = await apis.removeUser(userData.user_id)
    if (res.success) {
      message.success(res.msg)
    }
    else {
      message.error(res.msg)
    }
    setIsModalLoading(false)
    setIsModalOpen(false)
  }

  async function clickAddUser() {
    setIsModalLoading(true)
    let res = await apis.register(
      userData.name,
      userData.surname,
      userData.email,
      userData.mobile,
      userData.type
    )
    if (res.success) {
      message.success(res.msg);
      apis.userRows().then((res) => { setTableData(res) })
    }
    else {
      message.error(res.msg);
    }
    setIsModalLoading(false)
    setIsModalOpen(false)
  }

  useEffect(() => {
    setSiteToken(localStorage.getItem("site-token"))
    apis.userRows().then((res) => { setTableData(res) })
  }, [])

  useEffect(() => {
    if (siteToken === null) {
      setSigninState(false)
      router.push('/')
    }
    else {
      // TODO validate token (get /me)
      setSigninState(true)
    }
  }, [siteToken, router])

  return (
    <div>
      <HeaderMain title="Banphaeo Hospital : รายการบัญชีผู้ใช้งาน" />

      <main>
        <NavMain signinState={signinState} />
        {signinState === null &&
          <LoadingMain/>
        }
        {signinState === true &&
          <div className='container'>
            <NavSide  activeRoute='/accounts' />
            <div className='container-content'>
              <div style={{display:'flex',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                <h1>รายการผู้ใช้</h1>
                <Button key="cancelEdit" type="primary" primary onClick={clickAdd}>
                  เพิ่มผู้ใช้งาน
                </Button>
              </div>
              <Table columns={tableColumns} dataSource={tableData} style={{margin: "20px"}} />
              <Modal title="ข้อมูลผู้ใช้งาน"
                open={isModalOpen} onCancel={clickCancel} confirmLoading={isModalLoading}
                footer={modalFooterMode[modalPage]}>
                {modalPage == "เพิ่มผู้ใช้งาน" &&
                  <div>
                    <Row style={{alignItems:'center', marginBottom:'14px'}}>
                      <Col span={7}>ชื่อ :</Col>
                      <Col>
                        <Input value={userData.name} onChange={(e) => {setUserData((prev) => ({...prev, "name":e.target.value}))}} />
                      </Col>
                    </Row>
                    <Row style={{alignItems:'center', marginBottom:'14px'}}>
                      <Col span={7}>นามสกุล :</Col>
                      <Col>
                        <Input value={userData.surname} onChange={(e) => {setUserData((prev) => ({...prev, "surname":e.target.value}))}} />
                      </Col>
                    </Row>
                    <Row style={{alignItems:'center', marginBottom:'14px'}}>
                      <Col span={7}>อีเมล :</Col>
                      <Col>
                        <Input value={userData.email} onChange={(e) => {setUserData((prev) => ({...prev, "email":e.target.value}))}} />
                      </Col>
                    </Row>
                    <Row style={{alignItems:'center', marginBottom:'14px'}}>
                      <Col span={7}>เบอร์โทรศัพท์ :</Col>
                      <Col>
                        <Input value={userData.tel_number} onChange={(e) => {setUserData((prev) => ({...prev, "mobile":e.target.value}))}} />
                      </Col>
                    </Row>
                    <Row style={{alignItems:'center', marginBottom:'14px'}}>
                      <Col span={7}>ผู้จัดยา : </Col>
                      <Col span={15}>
                        <Select
                          showSearch
                          defaultValue="pharmacy"
                          value={userData.role}
                          style={{
                            width: 140,
                          }}
                          placeholder="Search to Select"
                          onChange={(e) => {setUserData((prev) => ({...prev, "type":e}))}}
                        >
                          <Option value="pharmacy">เภสัชกร</Option>
                          <Option value="staff">เจ้าหน้าที่</Option>
                        </Select>
                      </Col>
                    </Row>
                  </div>
                }
                {modalPage == "ข้อมูลผู้ใช้งาน" &&
                  <div>
                    <Row style={{alignItems:'center', marginBottom:'14px'}}>
                      <Col span={7}>ชื่อ :</Col>
                      <Col>
                        <Input value={userData.name} disabled />
                      </Col>
                    </Row>
                    <Row style={{alignItems:'center', marginBottom:'14px'}}>
                      <Col span={7}>อีเมล :</Col>
                      <Col>
                        <Input value={userData.email} disabled />
                      </Col>
                    </Row>
                    <Row style={{alignItems:'center', marginBottom:'14px'}}>
                      <Col span={7}>เบอร์โทรศัพท์ :</Col>
                      <Col>
                        <Input value={userData.tel_number} disabled />
                      </Col>
                    </Row>
                    <Row style={{alignItems:'center', marginBottom:'14px'}}>
                      <Col span={7}>ผู้จัดยา :</Col>
                      <Col>
                        <Input value={userData.role} disabled />
                      </Col>
                    </Row>
                  </div>
                }
              </Modal>
            </div>
          </div>
        }
      </main>

      <FooterMain withSidebar={true}/>
    </div>
  )
}
