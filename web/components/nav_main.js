import { UserOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Col, Input, message, Modal, Row, Select } from 'antd';
import { useEffect, useState } from 'react';
import Router from 'next/router';
import QRCode from 'react-qr-code';
import apis from '../manager/apis';

export default function NavMain(props) {
  const [btnDisable, setBtnDisable] = useState(false);
  const [inpDisable, setInpDisable] = useState(true);
  const [inpProfile, setInpProfile] = useState({
    "user_id": "ไม่พบข้อมูล",
    "email": "",
    "name": "",
    "surname": "",
    "tel_number": "",
    "role": ""
  })
  const [inpPassword, setInpPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [openLogout, setOpenLogout] = useState(false);
  const [modalPage, setModalPage] = useState('ข้อมูลทั่วไป');
  const modalFooterMode = {
    'ข้อมูลทั่วไป': [
      <Button key="logout" type="primary" danger onClick={clickLogout} disabled={btnDisable}>
        ออกจากระบบ
      </Button>,
      <Button key="editPassword" onClick={clickEditPassword} disabled={btnDisable}>
        แก้ไขรหัสผ่าน
      </Button>,
      <Button key="editProfile" onClick={clickEditProfile} disabled={btnDisable}>
        แก้ไขข้อมูล
      </Button>
    ],
    'แก้ไขข้อมูล': [
      <Button key="cancelEdit" onClick={clickCancelEditProfile} disabled={btnDisable}>
        ยกเลิก
      </Button>,
      <Button key="save" type="primary" onClick={clickSaveProfile} loading={loading} disabled={btnDisable}>
        บันทึก
      </Button>
    ],
    'แก้ไขรหัสผ่าน': [
      <Button key="cancelEdit" onClick={clickCancelEditPassword} disabled={btnDisable}>
        ยกเลิก
      </Button>,
      <Button key="savePassword" type="primary" onClick={clickSavePassword} loading={loading} disabled={btnDisable}>
        บันทึก
      </Button>
    ]
  }
  
  const { confirm } = Modal;
  const { Option } = Select;

  async function clickModal () {
    let uid = localStorage.getItem("user_id")
    if (uid == undefined || uid == null || uid == "") {
      localStorage.clear()
      Router.reload(window.location.pathname)
    }
    else {
      await apis.user(uid).then((res) => {
        setInpProfile(res)
        setOpen(true);
      })
    }
    setOpen(true);
    console.log('modalPage :>> ', modalPage);
  };

  function handleOk () {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOpen(false);
    }, 3000);
  };

  function handleCancel () {
    setInpDisable(true)
    setOpen(false);
  };

  function clickLogout () {
    confirm({
      icon: <ExclamationCircleOutlined />,
      content: 'ต้องการออกจากระบบ?',
      open: openLogout,
      onOk: clickConfirmLogout,
      onCancel: clickCancelLogout,
      okText: 'ใช่',
      cancelText: 'ไม่ใช่'
    });
  }

  function clickConfirmLogout () {
    localStorage.clear()
    Router.reload(window.location.pathname)
    Modal.destroyAll();
  }

  function clickCancelLogout () {
    setOpenLogout(false)
  }

  function clickEditPassword () {
    setInpDisable(false)
    setModalPage("แก้ไขรหัสผ่าน")
  }

  function clickEditProfile () {
    setInpDisable(false)
    setModalPage("แก้ไขข้อมูล")
  }

  function clickCancelEditProfile () {
    setInpDisable(true)
    setModalPage("ข้อมูลทั่วไป");
  }

  async function clickSaveProfile() {
    setLoading(true);
    setBtnDisable(true);
    let res = await apis.editProfile(inpProfile.user_id, inpProfile.name, inpProfile.surname, inpProfile.email, inpProfile.tel_number, inpProfile.role)
    if (res.success) {
      setModalPage("ข้อมูลทั่วไป");
      setLoading(false);
      setOpen(false);
      setBtnDisable(false);
      setInpDisable(true);
      message.success(res.msg)
    }
    else {
      setModalPage("ข้อมูลทั่วไป");
      setLoading(false);
      setOpen(false);
      setBtnDisable(false);
      setInpDisable(true);
      message.error(res.msg)
    }
  }

  function clickCancelEditPassword() {
    setInpDisable(true);
    setModalPage("ข้อมูลทั่วไป");
  }

  async function clickSavePassword() {
    setLoading(true);
    setInpDisable(true);
    let res = await apis.resetPassword(inpProfile.user_id, inpPassword)
    if (res.success) {
      setModalPage("ข้อมูลทั่วไป");
      setLoading(false);
      setOpen(false);
      setBtnDisable(false);
      setInpDisable(true);
      message.success(res.msg)
    }
    else {
      setModalPage("ข้อมูลทั่วไป");
      setLoading(false);
      setOpen(false);
      setBtnDisable(false);
      setInpDisable(true);
      message.error(res.msg)
    }
  }

  return (
    <div className='nav-main'>
      <strong className='nav-main-title'>Banphaeo Hospital</strong>
      {props.signinState === true &&
        <div>
          <Button type="default" shape="circle" icon={<UserOutlined />} onClick={clickModal} />
          <Modal
            open={open}
            title={modalPage}
            onOk={handleOk}
            onCancel={handleCancel}
            footer={modalFooterMode[modalPage]}
          >
            {(modalPage === "ข้อมูลทั่วไป" || modalPage === "แก้ไขข้อมูล") &&
              <div style={{'display':'flex','flexDirection':'row','alignItems':'center'}}>
                <div style={{'flex':3}}>
                  <Row style={{alignItems:'center', marginBottom:'14px'}}>
                    <Col span={9}>ชื่อ : </Col>
                    <Col>
                      <Input type='text' placeholder="ชื่อ" value={inpProfile.name} onChange={(e) => {setInpProfile((prev) => ({...prev, "name":e.target.value}))}} disabled={inpDisable}/>
                    </Col>
                  </Row>
                  <Row style={{alignItems:'center', marginBottom:'14px'}}>
                    <Col span={9}>นามสกุล : </Col>
                    <Col>
                      <Input type='text' placeholder="นามสกุล" value={inpProfile.surname} onChange={(e) => {setInpProfile((prev) => ({...prev, "surname":e.target.value}))}} disabled={inpDisable}/>
                    </Col>
                  </Row>
                  <Row style={{alignItems:'center', marginBottom:'14px'}}>
                    <Col span={9}>เบอร์โทรศัพท์ : </Col>
                    <Col>
                      <Input type='text' placeholder="เบอร์โทรศัพท์" value={inpProfile.tel_number} onChange={(e) => {setInpProfile((prev) => ({...prev, "tel_number":e.target.value}))}} disabled={inpDisable}/>
                    </Col>
                  </Row>
                  {inpProfile.role !== 'admin' &&
                    <Row style={{alignItems:'center', marginBottom:'14px'}}>
                      <Col span={9}>ผู้จัดยา : </Col>
                      <Col span={15}>
                      <Select
                        showSearch
                        defaultValue="pharmacy"
                        value={inpProfile.role}
                        style={{
                          width: 140,
                        }}
                        placeholder="Search to Select"
                        onChange={(e) => {setInpProfile((prev) => ({...prev, "role":e}))}}
                        disabled={inpDisable}
                      >
                        <Option value="pharmacy">เภสัชกร</Option>
                        <Option value="staff">เจ้าหน้าที่</Option>
                      </Select>
                      </Col>
                    </Row>
                  }
                  <Row style={{alignItems:'center', marginBottom:'14px'}}>
                    <Col span={9}>อีเมล : </Col>
                    <Col>
                      <Input type='text' placeholder="อีเมล" value={inpProfile.email} onChange={(e) => {setInpProfile((prev) => ({...prev, "email":e.target.value}))}} disabled={inpDisable}/>
                    </Col>
                  </Row>
                </div>
                <div style={{'flex':1}}>
                  <QRCode size={96} {...{'width':1,'height':50}} value={inpProfile.user_id.toString()} />
                </div>
              </div>
            }
            {modalPage === "แก้ไขรหัสผ่าน" &&
              <div>
                <Row style={{alignItems:'center', marginBottom:'14px'}}>
                  <Col span={7}>รหัสผ่านใหม่ : </Col>
                  <Col>
                    <Input type='text' placeholder="รหัสผ่านใหม่" onChange={(e) => {setInpPassword(e.target.value)}}/>
                  </Col>
                </Row>
            </div>
            }
          </Modal>
        </div>
      }
    </div>
  )
}
