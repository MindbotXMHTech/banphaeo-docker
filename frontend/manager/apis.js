import axios from "axios";

const host = process.env.NEXT_PUBLIC_HOST;

export default class apis {
  constructor() {}

  static async me(token) {
    let res = await axios({
      method: "get",
      url: host + "/web_me",
      headers: {
        authorization: "Bearer " + token,
      },
    });

    if (res.status === 200) {
      return { ...res.data, success: true };
    } else {
      return { success: false, msg: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง" };
    }
  }

  static async newPasswordRequest(email, iat) {
    let res = await axios({
      method: "post",
      url: host + "/web_password/request_reset",
      params: {
        email: email,
        iat: iat,
      },
    });

    if (res.data.success) {
      return {
        ...res.data,
        msg: `ส่ง OTP สำหรับเปลี่ยนรหัสผ่านไปที่ ${email} สำเร็จ กรุณาตรวจสอบกล่องข้อความ`,
      };
    } else {
      return {
        success: false,
        msg: `ไม่พบอีเมล ${email} ในระบบ กรุณาลงทะเบียน`,
      };
    }
  }

  static async newPasswordOtp(email, otp) {
    let res = await axios({
      method: "post",
      url: host + "/web_password/otp_validation",
      params: {
        email: email,
        otp: otp,
      },
    });

    if (res.data.msg === "valid") {
      return { success: true, msg: `ยืนยันตัวตนสำเร็จ`, token: res.data.token };
    } else if (res.data.msg === "invalid") {
      return { success: false, msg: `OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง` };
    } else {
      return { success: false, msg: `OTP หมดอายุ` };
    }
  }

  static async newPasswordReset(token, password) {
    let res = await axios({
      method: "put",
      url: host + "/web_password",
      headers: {
        authorization: "Bearer " + token,
      },
      params: {
        data: password,
      },
    });

    if (res.data.success) {
      return { success: true, msg: "เปลี่ยนรหัสผ่านสำเร็จ" };
    } else {
      return { success: false, msg: res.data.msg };
    }
  }

  static async login(email, password) {
    let res = await axios({
      method: "post",
      url: host + "/web_login",
      data: {
        email: email,
        password: password,
      },
    });

    if (res.data.success == true) {
      return {
        success: true,
        msg: "เข้าสู่ระบบสำเร็จ",
        profile: res.data.profile,
        token: res.data.token,
      };
    } else {
      return {
        success: false,
        msg: "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบ email / password อีกครั้ง",
      };
    }
  }

  static async register(name, surname, email, tel_number, role) {
    let res = await axios({
      method: "post",
      url: host + "/web_register",
      params: {
        name: name,
        surname: surname,
        email: email,
        password: tel_number,
        tel_number: tel_number,
        role: role,
      },
    }).catch((err) => {
      if (err.response.status == 400) {
        return {
          success: false,
          msg: "ข้อมูลผิดพลาด กรุณากรอกข้อมูลให้ครบทุกช่อง",
        };
      } else {
        return { success: false, msg: "Unknown query error occured." };
      }
    });

    if (res.data != "Add Register Complete") {
      return res;
    } else {
      return { success: true, msg: "ลงทะเบียนสำเร็จ" };
    }
  }

  static async validateEmail(email) {
    let res = await axios({
      method: "get",
      url: host + "/web_validate_email",
      params: {
        email: email,
      },
    }).catch((err) => {
      if (err.response.status == 422) {
        return {
          success: false,
          msg: "รูปแบบข้อมูล email ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลใหม่อีกครั้ง",
        };
      } else {
        return { success: false, msg: "Unknown query error occured." };
      }
    });

    if (res.data == "0") {
      return { success: true, msg: "สามารถใช้ email นี้ได้" };
    } else {
      return {
        success: false,
        msg: "อีเมลนี้เคยลงทะเบียนไปแล้ว กรุณาลอง email อื่น",
      };
    }
  }

  static async resetPassword(token, id, newpassword) {
    let res = await axios({
      method: "put",
      url: host + "/web_user/" + id + "/password",
      headers: {
        authorization: "Bearer " + token,
      },
      params: {
        data: newpassword,
      },
    });

    if (res.data.success) {
      return { success: true, msg: "เปลี่ยนรหัสผ่านสำเร็จ" };
    } else {
      return { success: false, msg: res.data.msg };
    }
  }

  static async editProfile(token, id, name, surname, email, tel_number, role) {
    let res = await axios({
      method: "put",
      url: host + "/web_user/" + id + "/profile",
      headers: {
        authorization: "Bearer " + token,
      },
      params: {
        name: name,
        surname: surname,
        email: email,
        tel_number: tel_number,
        role: role,
      },
    });
    return res.data;
  }

  static async prescriptionCards(token) {
    let res = await axios({
      method: "get",
      url: host + "/web_queue_cards",
      headers: {
        authorization: "Bearer " + token,
      },
    });
    return res.data;
  }

  static async prescriptionDetails(token, id) {
    let res = await axios({
      method: "get",
      url: host + "/web_prescription_record/" + id,
      headers: {
        authorization: "Bearer " + token,
      },
    });
    return res.data;
  }

  static async userRows(token) {
    let res = await axios({
      method: "get",
      url: host + "/web_user_rows",
      headers: {
        authorization: "Bearer " + token,
      },
    });
    return res.data;
  }

  static async removeUser(token, id) {
    let res = await axios({
      method: "delete",
      url: host + "/web_user/" + id,
      headers: {
        authorization: "Bearer " + token,
      },
    });
    return res.data;
  }

  static async user(token, id) {
    let res = await axios({
      method: "get",
      url: host + "/web_user/" + id,
      headers: {
        authorization: "Bearer " + token,
      },
    });
    return res.data;
  }

  static async statistic(token, sdate, edate) {
    sdate.set({ h: 0, m: 0, s: 0 });
    edate.set({ h: 0, m: 0, s: 0 }).add(1, "days");
    let res = await axios({
      method: "get",
      url: host + "/web_prescription_stats",
      headers: {
        authorization: "Bearer " + token,
      },
      params: {
        start_date: sdate,
        end_date: edate,
      },
    });
    return res.data;
  }
}
