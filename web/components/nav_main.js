import { UserOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Col, Input, message, Modal, Row, Select } from 'antd';
import { useEffect, useState, useMemo } from 'react';
import Router from 'next/router';
import QRCode from 'react-qr-code';
import apis from '../manager/apis';
import utilFuncs from '../manager/utils';
import { MaskedInput } from 'antd-mask-input';

export default function NavMain(props) {
  const defaultInpProfileStatus = {
    "email": null,
    "name": null,
    "surname": null,
    "tel_number": null,
    "role": null
  }
  const [btnDisable, setBtnDisable] = useState(false);
  const [btnSaveProfileDisable, setBtnSaveProfileDisable] = useState(false);
  const [btnSavePasswordDisable, setBtnSavePasswordDisable] = useState(false);
  const [inpDisable, setInpDisable] = useState(true);
  const [inpProfileFix, setInpProfileFix] = useState({
    "user_id": "ไม่พบข้อมูล",
    "email": "",
    "name": "",
    "surname": "",
    "tel_number": "",
    "role": ""
  })
  const [inpProfile, setInpProfile] = useState({
    "user_id": "ไม่พบข้อมูล",
    "email": "",
    "name": "",
    "surname": "",
    "tel_number": "",
    "role": ""
  })
  const [inpPassword, setInpPassword] = useState('');
  const [inpProfileStatus, setInpProfileStatus] = useState(defaultInpProfileStatus)
  const [inpPasswordStatus, setInpPasswordStatus] = useState('')

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
      <Button key="save" type="primary" onClick={clickSaveProfile} loading={loading} disabled={btnSaveProfileDisable}>
        บันทึก
      </Button>
    ],
    'แก้ไขรหัสผ่าน': [
      <Button key="cancelEdit" onClick={clickCancelEditPassword} disabled={btnDisable}>
        ยกเลิก
      </Button>,
      <Button key="savePassword" type="primary" onClick={clickSavePassword} loading={loading} disabled={btnSavePasswordDisable}>
        บันทึก
      </Button>
    ]
  }
  
  const { confirm } = Modal;
  const { Option } = Select;

  const cellphoneMask = '(000) 000-0000';
  const phoneMask = '(00) 000-0000';

  // always memoize dynamic masks
  const mask = useMemo(
    () => [
      {
        mask: cellphoneMask,
        lazy: false,
      },
      {
        mask: phoneMask,
        lazy: false,
      },
    ],
    []
  );

  async function clickModal () {
    let uid = localStorage.getItem("user_id")
    if (uid == undefined || uid == null || uid == "") {
      localStorage.clear()
      Router.reload(window.location.pathname)
    }
    else {
      await apis.user(uid).then((res) => {
        setInpProfile(res)
        setInpProfileFix(res)
        setOpen(true);
      })
    }
  };

  // handle modal's general event
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

  // handle logout
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

  // handle modal show profile
  function clickEditPassword () {
    setInpDisable(false)
    setModalPage("แก้ไขรหัสผ่าน")
  }

  function clickEditProfile () {
    setInpDisable(false)
    setModalPage("แก้ไขข้อมูล")
  }

  // handle modal edit profile
  function clickCancelEditProfile () {
    setInpDisable(true)
    setModalPage("ข้อมูลทั่วไป");
    setInpProfile(inpProfileFix)
    setInpProfileStatus(defaultInpProfileStatus)
  }

  async function clickSaveProfile() {
    setLoading(true);
    setBtnDisable(true);
    let res = await apis.editProfile(inpProfile.user_id, inpProfile.name, inpProfile.surname, inpProfile.email, inpProfile.tel_number, inpProfile.role)
    if (res.success) {
      setLoading(false);
      setOpen(false);
      setBtnDisable(false);
      message.success(res.msg)
    }
    else {
      setLoading(false);
      setOpen(false);
      setBtnDisable(false);
      message.error(res.msg)
    }
  }

  // handle modal edit password
  function clickCancelEditPassword() {
    setInpDisable(true);
    setModalPage("ข้อมูลทั่วไป");
  }

  async function clickSavePassword() {
    setLoading(true);
    setInpDisable(true);
    let res = await apis.resetPassword(inpProfile.user_id, inpPassword)
    if (res.success) {
      setLoading(false);
      setOpen(false);
      setBtnDisable(false);
      message.success(res.msg)
    }
    else {
      setLoading(false);
      setOpen(false);
      setBtnDisable(false);
      message.error(res.msg)
    }
  }

  useEffect(() => {
    if (!open) {
      setModalPage("ข้อมูลทั่วไป");
      setInpDisable(true);
      setInpProfileStatus(defaultInpProfileStatus)
    }
  }, [open])

  useEffect(() => {
    if (
      inpProfile.name.length !== 0 && 
      inpProfileStatus.email !== '1px solid red' &&
      inpProfile.email.length !== 0 && 
      inpProfile.surname.length !== 0 &&
      inpProfile.tel_number.length >= 9 &&
      inpProfile.role.length !== 0
    ) {
      setBtnSaveProfileDisable(false)
    } else {
      setBtnSaveProfileDisable(true)
    }
  }, [inpProfile, inpProfileStatus])

  useEffect(() => {
    if (!(inpPassword.length < 6)) {
      setInpPasswordStatus('')
      setBtnSavePasswordDisable(false)
    } else {
      setInpPasswordStatus('1px solid red')
      setBtnSavePasswordDisable(true)
    }
  }, [inpPassword])

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
                      <Input 
                        style={{border:inpProfileStatus.name}} 
                        type='text' 
                        placeholder="ชื่อ" 
                        value={inpProfile.name} 
                        onChange={(e) => {
                          setInpProfile((prev) => ({...prev, "name":e.target.value}))
                          if (e.target.value == null || e.target.value == "") {
                            setInpProfileStatus((prev) => ({...prev, "name":'1px solid red'}))
                          }
                          else {
                            setInpProfileStatus((prev) => ({...prev, "name":null}))
                          }
                        }} 
                        disabled={inpDisable}/>
                    </Col>
                  </Row>
                  <Row style={{alignItems:'center', marginBottom:'14px'}}>
                    <Col span={9}>นามสกุล : </Col>
                    <Col>
                      <Input 
                        style={{border:inpProfileStatus.surname}} 
                        type='text' 
                        placeholder="นามสกุล" 
                        value={inpProfile.surname} 
                        onChange={(e) => {
                          setInpProfile((prev) => ({...prev, "surname":e.target.value}))
                          if (e.target.value == null || e.target.value == "") {
                            setInpProfileStatus((prev) => ({...prev, "surname":'1px solid red'}))
                          }
                          else {
                            setInpProfileStatus((prev) => ({...prev, "surname":null}))
                          }
                        }} 
                        disabled={inpDisable}/>
                    </Col>
                  </Row>
                  <Row style={{alignItems:'center', marginBottom:'14px'}}>
                    <Col span={9}>เบอร์โทรศัพท์ : </Col>
                    <Col>
                      <MaskedInput
                        style={{border:inpProfileStatus.tel_number}} 
                        mask={mask}
                        maskOptions={{
                          dispatch: function (appended, dynamicMasked) {
                            const isCellPhone = (dynamicMasked.unmaskedValue[1] === '6') || (dynamicMasked.unmaskedValue[1] === '8') || (dynamicMasked.unmaskedValue[1] === '9');
                            return dynamicMasked.compiledMasks[isCellPhone ? 0 : 1];
                          },
                        }}
                        type='text' 
                        placeholder="เบอร์โทรศัพท์" 
                        value={inpProfile.tel_number} 
                        onChange={(e) => {
                          setInpProfile((prev) => ({...prev, "tel_number":e.unmaskedValue}))
                          if (e.unmaskedValue == null || e.unmaskedValue.length < 9) {
                            setInpProfileStatus((prev) => ({...prev, "tel_number":'1px solid red'}))
                          }
                          else {
                            setInpProfileStatus((prev) => ({...prev, "tel_number":null}))
                          }
                        }} 
                        disabled={inpDisable} />
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
                        disabled={true}
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
                      <Input style={{border:inpProfileStatus.email}} 
                        type='text' placeholder="อีเมล" 
                        value={inpProfile.email} 
                        onChange={async (e) => {
                          setInpProfile((prev) => ({...prev, "email":e.target.value}))
                          const isEmailExist = await apis.validateEmail(e.target.value)
                          if (utilFuncs.validateEmail(e.target.value) == null) {
                            setInpProfileStatus((prev) => ({...prev, "email":'1px solid red'}))
                          }
                          else if (!isEmailExist.success && e.target.value !== inpProfileFix.email) {
                            message.error(isEmailExist.msg)
                            setInpProfileStatus((prev) => ({...prev, "email":'1px solid red'}))
                          }
                          else {
                            setInpProfileStatus((prev) => ({...prev, "email":null}))
                          }
                        }} 
                        disabled={inpDisable}/>
                    </Col>
                  </Row>
                </div>
                <div style={{'flex':1, 'justifyContent':'center', 'textAlign':'center'}}>
                  <QRCode size={96} {...{'width':1,'height':50}} value={inpProfile.user_id.toString()} />
                  <p>
                    <span>QR Code</span><br/>
                    <span>สำหรับสแกน</span><br/>
                    <span>เครื่องตรวจสอบยา</span>
                  </p>
                </div>
              </div>
            }
            {modalPage === "แก้ไขรหัสผ่าน" &&
              <div>
                <Row style={{alignItems:'center', marginBottom:'14px'}}>
                  <Col span={7}>รหัสผ่านใหม่ : </Col>
                  <Col>
                    <Input style={{'border':inpPasswordStatus}} type='text' placeholder="รหัสผ่าน 6 ตัวอักษรขึ้นไป" onChange={(e) => {setInpPassword(e.target.value)}}/>
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
