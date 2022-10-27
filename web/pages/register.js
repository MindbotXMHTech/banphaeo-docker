import Head from 'next/head'
import Link from 'next/link' 
import styles from '../styles/index.module.css';
import { useEffect, useState } from 'react';
import { UserOutlined, EyeInvisibleOutlined, EyeTwoTone, LoadingOutlined } from '@ant-design/icons';
import { Button, Input, Col, Row, Select, Alert, message } from 'antd';
import { useRouter } from 'next/router';
import FooterMain from '../components/footer_main';
import NavMain from '../components/nav_main';
import LoadingMain from '../components/loading_main'
import HeaderMain from '../components/header_main';
import apis from '../manager/apis';

export default function Register() {
  const [signinState, setSigninState] = useState(null);
  const [siteToken, setSiteToken] = useState(null);
  const [inpEmail, setInpEmail] = useState('');
  const [inpFname, setInpFname] = useState('');
  const [inpLname, setInpLname] = useState('');
  const [inpMobile, setInpMobile] = useState('');
  const [inpRole, setInpRole] = useState('staff');
  const [inpPassword, setInpPassword] = useState('');
  const [inpRePassword, setInpRePassword] = useState('');
  const [inpRePasswordStatus, setInpRePasswordStatus] = useState(null);
  const [btnRegisterStatus, setBtnRegisterStatus] = useState(false);

  const router = useRouter();
  const { Option } = Select;

  async function clickRegister() {
    let res = await apis.register(inpFname, inpLname, inpEmail, inpPassword, inpMobile, inpRole)
    if (res.success) {
      message.success(res.msg);
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
      inpEmail.length !== 0 &&
      inpFname.length !== 0 &&
      inpLname.length !== 0 &&
      inpMobile.length !== 0 &&
      inpRole.length !== 0 &&
      inpPassword.length !== 0 &&
      inpRePassword.length !== 0 &&
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
              <Input type='email' placeholder="อีเมล" onChange={(e) => {setInpEmail(e.target.value)}} />
              <br />
              <Input type='text' placeholder="ชื่อ" onChange={(e) => {setInpFname(e.target.value)}}/>
              <br />
              <Input type='text' placeholder="นามสกุล" onChange={(e) => {setInpLname(e.target.value)}} />
              <br />
              <Input type='tel' placeholder="เบอร์โทรศัพท์" onChange={(e) => {setInpMobile(e.target.value)}} />
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
                placeholder="รหัสผ่าน" 
                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                onChange={(e) => {setInpPassword(e.target.value)}}
              />
              <br />
              <Input.Password 
                style={{border:inpRePasswordStatus}}
                placeholder="ยืนยันรหัสผ่าน" 
                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                onChange={(e) => {
                  setInpRePassword(e.target.value)
                  if (e.target.value === inpPassword) {
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
