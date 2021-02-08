$("#exit").click(() => {
  $.post('/', () => {
    location.href = '/';
  });
});

function password() {
  if ($('input[name="newPassword"]').val() != $('input[name="reconfirm"]').val()) {
    alert('你两次输入的密码不相等');
  } else {
    $.ajax({
      url: "/password",
      type: "POST",
      async: false,
      data: { oldPassword: $('input[name="oldPassword"]').val(), newPassword: $('input[name="newPassword"]').val() },
      dataType: "text",
      success: status => {
        switch (status) {
          case '-1':
            alert('发生未知错误，修改失败');
            break;
          case '0':
            alert('你的密码输入有误，请重新输入');
            break;
          case '1':
            alert('密码修改成功，请重新登录');
            $.post("/");
            location.href = "/";
            break;
          default:
            alert('答应我，别乱改奇怪的东西，好么？')
            break;
        }
      },
      error: e => {
        console.log(e)
      }
    });
  }
  return false;
}

function login() {
  $.ajax({
    url: "/login",
    type: "POST",
    async: false,
    data: { account: $('input[name="account"]').val(), password: $('input[name="password"]').val(), remember: $('#remember').prop('checked') },
    dataType: "text",
    success: status => {
      switch (status) {
        case '-1':
          alert('密码错误');
          break;
        case '0':
          alert('该账号不存在');
          break;
        case '1':
          location.href = "/admin";
          break;
        default:
          alert('答应我，别乱改奇怪的东西，好么？')
          break;
      }
    },
    error: e => {
      console.log(e)
    }
  });
  return false;
}