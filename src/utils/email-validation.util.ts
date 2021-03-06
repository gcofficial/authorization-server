const validation = function(email) {
  let tester, valid, parts, domain_parts;
  tester = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-?\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
  if (!email) {
    return false;
  }
  if(email.length>254) {
    return false;
  }
  valid = tester.test(email);
  if(!valid) {
    return false;
  }

  // Further checking of some things regex can't handle
  parts = email.split("@");
  if(parts[0].length > 64) {
    return false;
  }

  domain_parts = parts[1].split(".");
  if(domain_parts.some(function(part) { return part.length > 63; })) {
    return false;
  }

  return true;
}
export default validation;