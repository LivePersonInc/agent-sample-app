class String {

  static compare ( expected, received ) {
    //
    let expectedUpper = expected.toUpperCase();
    //
    let receivedUpper = received.toUpperCase();
    //
    return (expectedUpper.includes(receivedUpper));
  }
}

module.exports = String;