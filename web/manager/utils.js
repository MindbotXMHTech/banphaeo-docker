import apis from "./apis";

class utilFuncs {
  constructor() {}

  static daysInMonth (month, year) {
    return new Date(year, month, 0).getDate();
  }

  static getAge (tsbd) {
      var today = new Date();
      var birthDate = new Date(tsbd*1000);
      var y = today.getFullYear() - birthDate.getFullYear();
      var m = today.getMonth() - birthDate.getMonth();
      var d = today.getDate() - birthDate.getDate()
      if (m < 0 || (m === 0 && d < 0)) {
          y--;
          m = 11
      }
      if (m === 1 && d < 0) {
        m = 0
      }
      else if (m < 0) {
        m = 12 - birthDate.getMonth() + today.getMonth()
      }
      if (d < 0) {
        d = today.getDate() + Math.abs(birthDate.getDate() - daysInMonth(birthDate.getMonth(), birthDate.getFullYear()))
      }
      return {'year':y,'month':m,'day':d};
  }

  static async validateLogin (uid) {
    if (uid == undefined || uid == null || uid =="") {
      return false
    }
    else {
      apis.user(uid).then((res) => {
        if (res == null) {
          localStorage.clear()
          return false
        }
        else {
          let token = "mock";
          localStorage.setItem("site-token", token)
          localStorage.setItem("user_id", res.user_id)
          localStorage.setItem("name", res.name)
          localStorage.setItem("surname", res.surname)
          localStorage.setItem("email", res.email)
          localStorage.setItem("tel_number", res.tel_number)
          localStorage.setItem("role", res.role)
          return token
        }
      })
    }
  }
}

export default utilFuncs