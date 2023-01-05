import Head from 'next/head'
import Link from 'next/link' 
import styles from '../styles/index.module.css';
import { useEffect, useState } from 'react';
import { UserOutlined, EyeInvisibleOutlined, EyeTwoTone, LoadingOutlined } from '@ant-design/icons';
import { Button, Input, Col, Row, Select, Alert, message } from 'antd';
import MaskedInput from "antd-mask-input";
import { useRouter } from 'next/router';
import FooterMain from '../components/footer_main';
import NavMain from '../components/nav_main';
import LoadingMain from '../components/loading_main'
import HeaderMain from '../components/header_main';
import apis from '../manager/apis';
import utilFuncs from '../manager/utils'

export default function Register() {
  const [signinState, setSigninState] = useState(null);
  const [siteToken, setSiteToken] = useState(null);
  const [inpEmail, setInpEmail] = useState('');
  const [inpEmailStatus, setInpEmailStatus] = useState('');
  const [inpFname, setInpFname] = useState('');
  const [inpFnameStatus, setInpFnameStatus] = useState('');
  const [inpLname, setInpLname] = useState('');
  const [inpLnameStatus, setInpLnameStatus] = useState('');
  const [inpMobile, setInpMobile] = useState('');
  const [inpMobileStatus, setInpMobileStatus] = useState('');
  const [inpRole, setInpRole] = useState('staff');
  const [inpPassword, setInpPassword] = useState('');
  const [inpPasswordStatus, setInpPasswordStatus] = useState(null);
  const [inpRePassword, setInpRePassword] = useState('');
  const [inpRePasswordStatus, setInpRePasswordStatus] = useState(null);
  const [btnRegisterStatus, setBtnRegisterStatus] = useState(false);

  const router = useRouter();
  const { Option } = Select;

  async function clickRegister() {
    let res = await apis.register(inpFname, inpLname, inpEmail, inpMobile, inpRole)
    if (res.success) {
      message.success(res.msg);
      router.push('/');
    }
    else {
      message.error(res.msg);
    }
  }

  useEffect(() => {
    setSiteToken(localStorage.getItem("site-token"))
  }, [])

  useEffect(() => {
    if (siteToken === null) {
      setSigninState(false)
    }
    else {
      // TODO validate token (get /me)
      setSigninState(true)
      router.push('/')
    }
  }, [siteToken, router])

  useEffect(() => {
    if (
      inpEmail.length !== 0 && !inpEmailStatus &&
      inpFname.length !== 0 &&
      inpLname.length !== 0 &&
      inpMobile.length === 10 &&
      inpRole.length !== 0 &&
      inpPassword.length > 5 &&
      inpRePassword.length > 5 &&
      inpPassword === inpRePassword
    ) {
      setBtnRegisterStatus(true)
    }
    else {
      setBtnRegisterStatus(false)
    }
  }, [inpEmail, inpFname, inpLname, inpMobile, inpRole, inpPassword, inpRePassword])

  return (
    <div>
      <HeaderMain title="สมัครสมาชิก" />

      <main>
        <NavMain/>
        {signinState === null &&
          <LoadingMain/>
        }
        {signinState === false &&
          <div className={styles.signinContainer}>
            <div className={styles.signinContent}>
              <p className={styles.signinTitle}>สมัครสมาชิก</p>
              <Input style={{border:inpEmailStatus}} 
                type='email' 
                placeholder="อีเมล" 
                onChange={async (e) => {
                  setInpEmail(e.target.value)
                  const isEmailExist = await apis.validateEmail(e.target.value)
                  if (utilFuncs.validateEmail(e.target.value) == null) {
                    setInpEmailStatus('1px solid red')
                  }
                  else if (!isEmailExist.success) {
                    message.error(isEmailExist.msg)
                    setInpEmailStatus('1px solid red')
                  }
                  else {
                    setInpEmailStatus(null)
                  }
                }} />
              <br />
              <Input style={{border:inpFnameStatus}} 
                type='text' 
                placeholder="ชื่อ" 
                onChange={(e) => {
                  setInpFname(e.target.value)
                  if (e.target.value == null || e.target.value == "") {
                    setInpFnameStatus('1px solid red')
                  }
                  else {
                    setInpFnameStatus(null)
                  }
                }} />
              <br />
              <Input style={{border:inpLnameStatus}} 
                type='text' 
                placeholder="นามสกุล" 
                onChange={(e) => {
                  setInpLname(e.target.value)
                  if (e.target.value == null || e.target.value == "") {
                    setInpLnameStatus('1px solid red')
                  }
                  else {
                    setInpLnameStatus(null)
                  }
                }} />
              <br />
              <MaskedInput
                style={{border:inpMobileStatus}} 
                mask={
                  '000-000-0000'
                }
                type='text' 
                placeholder="เบอร์โทรศัพท์" 
                onChange={(e) => {
                  setInpMobile(e.unmaskedValue)
                  if (e.unmaskedValue == null || e.unmaskedValue.length !== 10) {
                    setInpMobileStatus('1px solid red')
                  }
                  else {
                    setInpMobileStatus(null)
                  }
                }} />
              <br />
              <Row style={{alignItems:'center'}}>
                <Col style={{textAlign:'center'}} span={7}>ผู้จัดยา : </Col>
                <Col span={17}>
                <Select
                  showSearch
                  defaultValue="pharmacy"
                  style={{
                    width: 140,
                  }}
                  placeholder="Search to Select"
                  onChange={(e) => {setInpRole(e)}}
                >
                  <Option value="pharmacy">เภสัชกร</Option>
                  <Option value="staff">เจ้าหน้าที่</Option>
                </Select>
                </Col>
              </Row>
              <br />
              <Input.Password 
                style={{border:inpPasswordStatus}}
                placeholder="รหัสผ่าน 6 ตัวอักษรขึ้นไป" 
                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                onChange={(e) => {
                  setInpPassword(e.target.value)
                  if (e.target.value == null || e.target.value.length < 6) {
                    setInpPasswordStatus('1px solid red')
                  }
                  else {
                    setInpPasswordStatus(null)
                  }
                }}
              />
              <br />
              <Input.Password 
                style={{border:inpRePasswordStatus}}
                placeholder="ยืนยันรหัสผ่าน" 
                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                onChange={(e) => {
                  setInpRePassword(e.target.value)
                  if (e.target.value === inpPassword && e.target.value.length > 5) {
                    setInpRePasswordStatus(null)
                  }
                  else {
                    setInpRePasswordStatus('1px solid red')
                  }
                }}
              />
              <br />
              <Button type="primary" shape="round" size='middle' onClick={clickRegister} disabled={!btnRegisterStatus}>
                สมัครสมาชิก
              </Button>
              <Link href="/">
                <Button type="link" size='middle' style={{color:'grey'}}>
                  ย้อนกลับ
                </Button>
              </Link>
            </div>
          </div>
        }
      </main>

      <FooterMain/>
    </div>
  )
}
