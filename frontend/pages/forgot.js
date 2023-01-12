import Head from "next/head";
import Link from "next/link";
import styles from "../styles/index.module.css";
import { useEffect, useState } from "react";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { Button, Input, Col, Row, message } from "antd";
import { useRouter } from "next/router";
import NavMain from "../components/nav_main";
import FooterMain from "../components/footer_main";
import LoadingMain from "../components/loading_main";
import HeaderMain from "../components/header_main";
import apis from "../manager/apis";

export default function Register() {
  const [signinState, setSigninState] = useState(false);
  const [siteToken, setSiteToken] = useState(null);
  const [inp, setInp] = useState();
  const [inpRePasswordStatus, setInpRePasswordStatus] = useState(null);
  const [requestState, setRequestState] = useState(1);
  const [otp, setOtp] = useState();
  const [otpRef, setOtpRef] = useState();
  const [otpExpireMin, setOtpExpireMin] = useState();
  const [sendTime, setSendTime] = useState();

  const router = useRouter();

  function clickNext() {
    if (requestState === 1) {
      let now = Date.now();
      setSigninState(null);
      setSendTime(new Date(now));
      apis.newPasswordRequest(inp, now).then((res) => {
        setSigninState(false);
        if (res.success) {
          setOtpRef(res.otp_ref);
          setOtpExpireMin(Math.floor(res.otp_expired_ms / 60000));
          message.success(res.msg);
          setRequestState(2);
        } else {
          message.error(res.msg);
        }
      });
    } else if (requestState === 2) {
      setSigninState(null);
      apis.newPasswordOtp(inp, otp).then((res) => {
        setSigninState(false);
        if (res.success) {
          setSiteToken(res.token);
          setRequestState(3);
        } else {
          message.error(res.msg);
        }
      });
    } else if (requestState === 3) {
      setSigninState(null);
      apis.newPasswordReset(siteToken, inp).then((res) => {
        if (res.success) {
          message.success(res.msg);
          router.push("/");
        } else {
          setSigninState(false);
          message.error(res.msg);
        }
      });
    }
  }

  return (
    <div>
      <HeaderMain title="ลืมรหัสผ่าน" />

      <main>
        <NavMain signinState={false} />
        {signinState === null && <LoadingMain />}
        {signinState === false && (
          <div className={styles.signinContainer}>
            <div className={styles.signinContent}>
              <p className={styles.signinTitle}>ลืมรหัสผ่าน?</p>

              {requestState === 1 && (
                <div>
                  <Row>
                    <Col>
                      <Button type="primary" shape="circle">
                        1
                      </Button>
                      &nbsp;ส่ง OTP&nbsp;&nbsp;&nbsp;
                    </Col>
                    <Col>
                      <Button type="default" shape="circle">
                        2
                      </Button>
                      &nbsp;กรอกรหัส&nbsp;&nbsp;&nbsp;
                    </Col>
                    <Col>
                      <Button type="default" shape="circle">
                        3
                      </Button>
                      &nbsp;เปลี่ยนรหัสผ่าน
                    </Col>
                  </Row>
                  <br />
                  <Input
                    type="email"
                    placeholder="อีเมล"
                    onChange={(e) => {
                      setInp(e.target.value);
                    }}
                  />
                  <br />
                  <br />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Button
                      type="primary"
                      shape="round"
                      size="middle"
                      onClick={clickNext}
                    >
                      ขอรับรหัส OTP
                    </Button>
                    <Link href="/">
                      <Button
                        type="link"
                        size="middle"
                        style={{ color: "grey" }}
                      >
                        ย้อนกลับ
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              {requestState === 2 && (
                <div>
                  <Row>
                    <Col>
                      <Button type="default" shape="circle" disabled>
                        1
                      </Button>
                      &nbsp;ส่ง OTP&nbsp;&nbsp;&nbsp;
                    </Col>
                    <Col>
                      <Button type="primary" shape="circle">
                        2
                      </Button>
                      &nbsp;กรอกรหัส&nbsp;&nbsp;&nbsp;
                    </Col>
                    <Col>
                      <Button type="default" shape="circle">
                        3
                      </Button>
                      &nbsp;เปลี่ยนรหัสผ่าน
                    </Col>
                  </Row>
                  <br />
                  <p>กรุณาดำเนินการภายใน {otpExpireMin} นาที</p>
                  <Input
                    type="text"
                    placeholder={"กรอกรหัส OTP [ref: " + otpRef + "]"}
                    onChange={(e) => {
                      setOtp(e.target.value);
                    }}
                  />
                  <br />
                  <br />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Button
                      type="primary"
                      shape="round"
                      size="middle"
                      onClick={clickNext}
                    >
                      ถัดไป
                    </Button>
                    <Link href="/">
                      <Button
                        type="link"
                        size="middle"
                        style={{ color: "grey" }}
                      >
                        ย้อนกลับ
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              {requestState === 3 && (
                <div>
                  <Row>
                    <Col>
                      <Button type="default" shape="circle" disabled>
                        1
                      </Button>
                      &nbsp;ส่ง OTP&nbsp;&nbsp;&nbsp;
                    </Col>
                    <Col>
                      <Button type="default" shape="circle" disabled>
                        2
                      </Button>
                      &nbsp;กรอกรหัส&nbsp;&nbsp;&nbsp;
                    </Col>
                    <Col>
                      <Button type="primary" shape="circle">
                        3
                      </Button>
                      &nbsp;เปลี่ยนรหัสผ่าน
                    </Col>
                  </Row>
                  <br />
                  <Input.Password
                    placeholder="รหัสผ่าน"
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                    onChange={(e) => {
                      setInp(e.target.value);
                    }}
                  />
                  <br />
                  <br />
                  <Input.Password
                    style={{ border: inpRePasswordStatus }}
                    placeholder="ยืนยันรหัสผ่าน"
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                    onChange={(e) => {
                      if (e.target.value === inp) {
                        setInpRePasswordStatus(null);
                      } else {
                        setInpRePasswordStatus("1px solid red");
                      }
                    }}
                  />
                  <br />
                  <br />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <Button
                      type="primary"
                      shape="round"
                      size="middle"
                      onClick={clickNext}
                    >
                      ถัดไป
                    </Button>
                    <Link href="/">
                      <Button
                        type="link"
                        size="middle"
                        style={{ color: "grey" }}
                      >
                        ย้อนกลับ
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <FooterMain />
    </div>
  );
}
