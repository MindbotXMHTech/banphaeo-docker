import axios from "axios"
import vars from '../store/vars';

export default class apis {
  constructor() {}

  static async login(email, password) {
    let res = await axios({
      "method": "post",
      "url": vars["HOST"] + "/web_login",
      "data": {
        "email": email,
        "password": password
      }
    })

    if (res.data.success == true) {
      return {"success": true, "msg": "เข้าสู่ระบบสำเร็จ", "profile": res.data.profile}
    } 
    else {
      return {"success": false, "msg": "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบ email / password อีกครั้ง"}
    }
  }

  static async register(name, surname, email, tel_number, role) {
    let res = await axios({
      "method": "post",
      "url": vars["HOST"] + "/web_register",
      "params": {
        "name": name, 
        "surname": surname, 
        "email": email, 
        "password": tel_number, 
        "tel_number": tel_number, 
        "role": role
      }
    }).catch((err) => {
      if (err.response.status == 400) {
        return {"success": false, "msg": "ข้อมูลผิดพลาด กรุณากรอกข้อมูลให้ครบทุกช่อง"}
      }
      else {
        return {"success": false, "msg": "Unknown query error occured."}
      }
    })

    if (res.data != "Add Register Complete") {
      return res
    }
    else {
      return {"success": true, "msg": "ลงทะเบียนสำเร็จ"}
    }
  }

  static async validateEmail(email) {
    let res = await axios({
      "method": "get",
      "url": vars["HOST"] + "/web_validate_email",
      "params": {
        "email": email
      }
    }).catch((err) => {
      if (err.response.status == 422) {
        return {"success": false, "msg": "รูปแบบข้อมูล email ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลใหม่อีกครั้ง"}
      }
      else {
        return {"success": false, "msg": "Unknown query error occured."}
      }
    })

    if (res.data == "0") {
      return {"success": true, "msg": "สามารถใช้ email นี้ได้"}
    }
    else {
      return {"success": false, "msg": "อีเมลนี้เคยลงทะเบียนไปแล้ว กรุณาลอง email อื่น หรือกด \"ลืมรหัสผ่าน\""}
    }
  }

  static async resetPassword(id, newpassword) {
    let res = await axios({
      "method": "put",
      "url": vars["HOST"] + "/web_user/" + id + "/password",
      "params": {
        "data": newpassword
      }
    })

    if (res.data.success) {
      return {"success": true, "msg": "เปลี่ยนรหัสผ่านสำเร็จ"}
    }
    else {
      return {"success": false, "msg": res.data.msg}
    }
  }

  static async editProfile(id, name, surname, email, tel_number, role) {
    let res = await axios({
      "method": "put",
      "url": vars["HOST"] + "/web_user/" + id + "/profile",
      "params": {
        "name": name, 
        "surname": surname, 
        "email": email, 
        "tel_number": tel_number, 
        "role": role
      }
    })
    return res.data
  }

  static async prescriptionCards(loginId) {
    let res = await axios({
      "method": "get",
      "url": vars["HOST"] + "/web_queue_cards",
      "headers": {
        "login_id": loginId
      }
    })
    return res.data
  }

  static async prescriptionDetails(id) {
    let res = await axios({
      "method": "get",
      "url": vars["HOST"] + "/web_prescription_record/" + id
    })
    return res.data
  }

  static async userRows() {
    let res = await axios({
      "method": "get",
      "url": vars["HOST"] + "/web_user_rows"
    })
    return res.data
  }

  static async removeUser(id) {
    let res = await axios({
      "method": "delete",
      "url": vars["HOST"] + "/web_user/" + id
    })
    return res.data
  }

  static async user(id) {
    let res = await axios({
      "method": "get",
      "url": vars["HOST"] + "/web_user/" + id
    })
    return res.data
  }

  static async statistic(sdate, edate) {
    let res = await axios({
      "method": "get",
      "url": vars["HOST"] + "/web_prescription_stats",
      "params": {
        "start_date": sdate,
        "end_date": edate
      }
    })
    return res.data
  }
}
