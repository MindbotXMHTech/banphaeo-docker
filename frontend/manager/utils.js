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

  static validateEmail (email) {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };
}

export default utilFuncs