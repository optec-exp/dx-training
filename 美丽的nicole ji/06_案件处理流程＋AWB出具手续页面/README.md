[index (6).html](https://github.com/user-attachments/files/26916090/index.6.html)

<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>业务部作业手册</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Noto Sans SC', sans-serif;
    background: #f0f2f5;
    color: #1a1a2e;
    min-height: 100vh;
    padding: 40px 20px;
  }

  .page { max-width: 760px; margin: 0 auto; }

  .header { margin-bottom: 36px; }
  .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
  .header p { font-size: 13px; color: #999; }

  /* 三大卡片 */
  .card {
    background: #fff;
    border-radius: 16px;
    margin-bottom: 16px;
    overflow: hidden;
    border: 1.5px solid transparent;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
  .card.c1 { border-color: #e0defe; }
  .card.c2 { border-color: #c5ead9; }
  .card.c3 { border-color: #fdd9b5; }
  .card.open.c1 { border-color: #7F77DD; }
  .card.open.c2 { border-color: #1D9E75; }
  .card.open.c3 { border-color: #E88A2E; }

  /* 卡片头部 — 可点击 */
  .card-head {
    display: flex; align-items: center; gap: 20px;
    padding: 24px 28px;
    cursor: pointer;
    user-select: none;
  }

  .card-icon {
    width: 56px; height: 56px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; font-weight: 700; color: #fff;
    flex-shrink: 0;
  }
  .c1 .card-icon { background: #7F77DD; }
  .c2 .card-icon { background: #1D9E75; }
  .c3 .card-icon { background: #E88A2E; }

  .card-meta { flex: 1; }
  .card-title { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .card-desc { font-size: 13px; color: #888; }

  .card-pills { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
  .pill {
    font-size: 11px; font-weight: 500; padding: 3px 10px;
    border-radius: 20px; border: 1px solid;
  }
  .pill-purple { background: #EEEDFE; color: #534AB7; border-color: #AFA9EC; }
  .pill-green  { background: #E1F5EE; color: #0F6E56; border-color: #9FE1CB; }
  .pill-teal   { background: #e0f4ff; color: #0369a1; border-color: #7dd3fc; }
  .pill-orange { background: #fff3e6; color: #b85c00; border-color: #FAC775; }

  .chevron {
    font-size: 20px; color: #ccc;
    transition: transform 0.3s;
    flex-shrink: 0;
  }
  .card.open .chevron { transform: rotate(180deg); color: #888; }

  /* 展开内容区 */
  .card-body {
    display: none;
    padding: 0 28px 28px;
    animation: fadeIn 0.25s ease;
  }
  .card.open .card-body { display: block; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

  .body-divider {
    height: 1px; background: #f0f2f5;
    margin-bottom: 24px;
  }

  /* 子标签 */
  .sub-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
  .sub-tab {
    padding: 7px 18px; border-radius: 20px; font-size: 13px;
    font-weight: 500; border: 1.5px solid #e0e0e0;
    background: #f8f9fb; cursor: pointer; color: #666;
    transition: all 0.2s;
  }
  .sub-tab.active { background: #1D9E75; color: #fff; border-color: #1D9E75; }

  .sub-flow { display: none; flex-direction: column; }
  .sub-flow.active { display: flex; }

  /* 步骤 */
  .step {
    display: flex; gap: 14px; align-items: flex-start;
    background: #f8f9fb;
    border-radius: 10px; padding: 16px 18px;
    border-left: 3px solid #e0e3e8;
  }
  .step.s-purple { border-left-color: #7F77DD; }
  .step.s-green  { border-left-color: #1D9E75; }
  .step.s-blue   { border-left-color: #378ADD; }
  .step.s-orange { border-left-color: #E88A2E; }
  .step.s-key    { border-left-color: #1D9E75; background: #f0faf6; }

  .snum {
    width: 28px; height: 28px; border-radius: 50%;
    font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 1px;
  }
  .step.s-purple .snum { background: #EEEDFE; color: #534AB7; }
  .step.s-green .snum  { background: #E1F5EE; color: #0F6E56; }
  .step.s-blue .snum   { background: #eff6ff; color: #1d4ed8; }
  .step.s-orange .snum { background: #fff3e6; color: #b85c00; }
  .step.s-key .snum    { background: #1D9E75; color: #fff; }

  .scontent { flex: 1; }
  .scontent h3 { font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 3px; }
  .scontent p  { font-size: 13px; color: #666; line-height: 1.7; }

  .sarrow { text-align: center; color: #d0d5db; font-size: 14px; padding: 3px 0; margin-left: 14px; }

  .stag {
    display: inline-block; font-size: 11px; padding: 2px 8px;
    border-radius: 4px; margin-top: 5px; font-weight: 500;
  }
  .stag-green  { background: #e6f7f1; color: #0F6E56; }
  .stag-orange { background: #fff3e6; color: #b85c00; }
  .stag-blue   { background: #eff6ff; color: #1d4ed8; }
  .stag-purple { background: #EEEDFE; color: #534AB7; }
  .stag-gray   { background: #f3f4f6; color: #666; }

  .detail {
    display: none; margin-top: 10px; padding: 10px 14px;
    background: #fff; border-radius: 8px;
    font-size: 13px; color: #555; line-height: 1.8;
    border: 1px solid #e8ecf0;
  }
  .detail.open { display: block; }
  .detail ul { padding-left: 16px; }
  .detail li { margin-bottom: 3px; }

  .toggle-btn {
    margin-top: 7px; font-size: 12px; padding: 3px 10px;
    border-radius: 6px; border: 1px solid #ddd;
    background: #fff; cursor: pointer; color: #666;
    transition: background 0.15s;
  }
  .toggle-btn:hover { background: #f0f2f5; }

  .ext-link {
    display: inline-block; margin-top: 8px; font-size: 12px;
    padding: 4px 12px; border-radius: 6px;
    border: 1px solid #1D9E75; color: #1D9E75;
    text-decoration: none; background: #f0faf6;
    transition: background 0.15s;
  }
  .ext-link:hover { background: #e1f5ee; }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <h1>业务部作业手册</h1>
    <p>货代业务管理程序 OPTYT-2-YW-01 — 点击各板块查看详细流程</p>
  </div>

  <!-- ===== 一、案件处理流程 ===== -->
  <div class="card c1" id="card1">
    <div class="card-head" onclick="toggleCard('card1')">
      <div class="card-icon">一</div>
      <div class="card-meta">
        <div class="card-title">案件处理流程</div>
        <div class="card-desc">报价组 + 操作组 — 从询价到收货完结</div>
        <div class="card-pills">
          <span class="pill pill-purple">询价 / 报价</span>
          <span class="pill pill-green">NFO 操作</span>
          <span class="pill pill-teal">OBC 操作</span>
        </div>
      </div>
      <div class="chevron">▼</div>
    </div>

    <div class="card-body">
      <div class="body-divider"></div>

      <!-- 询价部分 -->
      <div style="font-size:13px;font-weight:700;color:#7F77DD;margin-bottom:12px;letter-spacing:.04em">询价阶段 — 报价组负责</div>

      <div class="step s-purple">
        <div class="snum">1</div>
        <div class="scontent">
          <h3>客户询盘</h3>
          <p>通过邮件、微信、电话等方式获得询盘</p>
          <button class="toggle-btn" onclick="toggleDetail(this)">查看详情 ▼</button>
          <div class="detail">
            <ul>
              <li>要求服务、始发地和目的地</li>
              <li>货量 / 货物性质（判断是否可运输）</li>
              <li>提货和交货时间、特殊要求</li>
              <li>默认不进行货物保险投保（客户无明确要求时）</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="sarrow">↓</div>

      <div class="step s-purple">
        <div class="snum">2</div>
        <div class="scontent">
          <h3>录入 KINTONE / 判断新老客户</h3>
          <p>录入询盘信息，搜索顾客名，判断信用额度和账期</p>
          <button class="toggle-btn" onclick="toggleDetail(this)">查看详情 ▼</button>
          <div class="detail">
            <ul>
              <li>新客户：按语言（中/日/英）选对应来宾账户</li>
              <li>老客户：确认与信额度和账期</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="sarrow">↓</div>

      <div class="step s-purple">
        <div class="snum">3</div>
        <div class="scontent">
          <h3>形成报价方案</h3>
          <p>常规参考报价规则一览表；特殊由日本总公司协商确认</p>
          <span class="stag stag-purple">OPTYT-2-YW-01-01</span>
        </div>
      </div>
      <div class="sarrow">↓</div>

      <div class="step s-purple">
        <div class="snum">4</div>
        <div class="scontent">
          <h3>沟通方案 / 回访跟进</h3>
          <p>未成交时针对性回访；方案调整后修正再确认；须通过邮件正式确认</p>
        </div>
      </div>
      <div class="sarrow">↓</div>

      <div class="step s-key">
        <div class="snum">5</div>
        <div class="scontent">
          <h3>KINTONE 移交操作组</h3>
          <p>成交案件转移 KINTONE，通知操作人员接手</p>
          <span class="stag stag-green">关键节点 — 进入操作阶段</span>
        </div>
      </div>

      <!-- 操作部分 -->
      <div style="font-size:13px;font-weight:700;color:#1D9E75;margin:28px 0 12px;letter-spacing:.04em">操作阶段 — 操作组负责</div>

      <div class="sub-tabs">
        <button class="sub-tab active" onclick="showSub('nfo', this)">NFO 普通航空货运</button>
        <button class="sub-tab" onclick="showSub('obc', this)">OBC 随机押运</button>
      </div>

      <!-- NFO -->
      <div class="sub-flow active" id="flow-nfo">
        <div class="step s-green">
          <div class="snum">1</div>
          <div class="scontent">
            <h3>判断业务类型</h3>
            <p>门到门 / 门到港 / 港到门 / 港到港</p>
            <span class="stag stag-gray">门到门：1-14 ｜ 门到港：1-9 ｜ 港到门：9-14</span>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">2</div>
          <div class="scontent">
            <h3>联系发货商确认货物信息</h3>
            <p>货物信息、性质、始发地/目的地、提货地址及时间、报关文件及电子委托</p>
            <span class="stag stag-gray">文件存公司云端，更新时删旧存新</span>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">3</div>
          <div class="scontent">
            <h3>安排运输单位（提货）</h3>
            <p>告知货物性质、提货地址、堆放要求、车型要求，安排合适运输工具</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-key">
          <div class="snum">4</div>
          <div class="scontent">
            <h3>订舱 — 获取 AWB NO</h3>
            <p>按报价单航班信息订舱，AWB NO 出现后及时告知客户并录入 KINTONE</p>
            <span class="stag stag-green">关键节点</span>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">5</div>
          <div class="scontent">
            <h3>合作方仓库货物验收</h3>
            <p>确认包装、航司要求、货物称重；制作 Draft 给客户确认</p>
            <button class="toggle-btn" onclick="toggleDetail(this)">查看详情 ▼</button>
            <div class="detail"><ul>
              <li>客户确认无误 → 进行出口申报</li>
              <li>Draft 有问题 → 修改后再确认</li>
              <li>货物有问题 → 与客户协商处理</li>
              <li>发现货物损坏 → 依《运输异常情况管理办法》执行</li>
            </ul></div>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">6</div>
          <div class="scontent">
            <h3>出口申报</h3>
            <p>报关文件 → 报关行出预录单 → 发货商确认 → 申报放行</p>
            <p style="margin-top:4px">放行后发送 Pre-alert（目的港清关箱单发票 + Final AWB）给客户，文件上传云端</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">7</div>
          <div class="scontent">
            <h3>送到货站 / 海关查验</h3>
            <button class="toggle-btn" onclick="toggleDetail(this)">查看详情 ▼</button>
            <div class="detail"><ul>
              <li>系统放行 → 顺利进入货站</li>
              <li>系统查验 → 预约海关查验</li>
              <li>查验合格 → 放行后交货站</li>
              <li>查验不合格 → 依异常办法执行</li>
              <li>扣货 → 告知客户，配合提供证明材料</li>
            </ul></div>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">8</div>
          <div class="scontent">
            <h3>安检 & 组板</h3>
            <p>安检通过 → 货站打板装载；安检不通过 → 依异常办法执行</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-blue">
          <div class="snum">9</div>
          <div class="scontent">
            <h3>货物追踪（实时）</h3>
            <p>通过提单号追踪起飞/降落，实时通过系统邮件向客户汇报</p>
            <span class="stag stag-blue">全程持续执行</span>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">10</div>
          <div class="scontent">
            <h3>目的港货物信息查询</h3>
            <p>通过目的港海关系统查询货物信息</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">11</div>
          <div class="scontent">
            <h3>进口申报</h3>
            <p>提前申报或落地后申报，可由操作组 / 合作方 / 客户执行</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">12</div>
          <div class="scontent">
            <h3>放行或查验</h3>
            <button class="toggle-btn" onclick="toggleDetail(this)">查看详情 ▼</button>
            <div class="detail"><ul>
              <li>放行 → 短驳到合作方仓库验收，发到货通知</li>
              <li>查验 → 联系进口商配合查验</li>
              <li>查验不合格 → 依异常办法执行</li>
            </ul></div>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">13</div>
          <div class="scontent">
            <h3>安排末端派送</h3>
            <p>客户自提 或 运输交货（签收单拍照回传操作组，上传云端）</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-key">
          <div class="snum">14</div>
          <div class="scontent">
            <h3>收货方收货确认</h3>
            <p>收货方验收签收，操作组上传云端并告知客户，KINTONE 更新</p>
            <span class="stag stag-green">案件完结</span>
          </div>
        </div>
      </div>

      <!-- OBC -->
      <div class="sub-flow" id="flow-obc">
        <div class="step s-green">
          <div class="snum">1</div>
          <div class="scontent">
            <h3>判断业务类型</h3>
            <p>门到门 / 门到港 / 港到门 / 港到港</p>
            <span class="stag stag-gray">门到门：1-15 ｜ 门到港：1-11 ｜ 港到门：11-15</span>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">2</div>
          <div class="scontent">
            <h3>联系发货商确认货物信息</h3>
            <p>货物信息、性质、始发地/目的地、提货地址及时间、报关文件</p>
            <span class="stag stag-gray">口头/电话确认需邮件再次确认，文件存云端</span>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">3</div>
          <div class="scontent">
            <h3>安排运输单位（提货）</h3>
            <p>根据货物件数、重量、尺寸、堆放要求安排合适车辆</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">4</div>
          <div class="scontent">
            <h3>交给指定接货人（飞人）</h3>
            <p>确认货物件数、外包装，查收货物并拍照留档</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">5</div>
          <div class="scontent">
            <h3>出口申报</h3>
            <button class="toggle-btn" onclick="toggleDetail(this)">查看详情 ▼</button>
            <div class="detail"><ul>
              <li>未开放申报口岸：经发货人和客户确认后可不做申报</li>
              <li>已开放申报口岸：报关文件 → 预录单确认 → 申报 → 放行资料回传发货商</li>
            </ul></div>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">6</div>
          <div class="scontent">
            <h3>海关验货</h3>
            <p>海关核对货物与报关单；核对无误放行告知客户；有误依异常办法执行</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">7</div>
          <div class="scontent">
            <h3>值机</h3>
            <p>飞人到柜台或自助机值机，获取登机牌，告知客户及操作组</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">8</div>
          <div class="scontent">
            <h3>托运货物</h3>
            <p>行李托运，获取托运小票，货物再包装、贴易碎标签，告知客户</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">9</div>
          <div class="scontent">
            <h3>机场地面安检</h3>
            <p>安检通过 → 航司接收；安检不通过 → 依异常办法执行</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">10</div>
          <div class="scontent">
            <h3>登机</h3>
            <p>飞人登机确认行李搭载，记录工作人员姓名，微信告知操作组和客户</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-blue">
          <div class="snum">11</div>
          <div class="scontent">
            <h3>航班追踪（实时）</h3>
            <p>通过航班号追踪起飞/降落，实时汇报客户</p>
            <span class="stag stag-blue">全程持续执行</span>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">12</div>
          <div class="scontent">
            <h3>移民局（海外段）</h3>
            <p>国内不涉及；涉及海外国家时需通过；不通过依异常办法执行</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">13</div>
          <div class="scontent">
            <h3>红色通道申报</h3>
            <p>飞人落地后提取货物，走红色通道提交报关文件；放行告知客户</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-green">
          <div class="snum">14</div>
          <div class="scontent">
            <h3>安排末端派送</h3>
            <p>客户自提 或 运输交货（签收单拍照回传，上传云端）</p>
          </div>
        </div>
        <div class="sarrow">↓</div>
        <div class="step s-key">
          <div class="snum">15</div>
          <div class="scontent">
            <h3>收货方收货确认</h3>
            <p>收货方验收签收，告知客户，KINTONE 更新</p>
            <span class="stag stag-green">案件完结</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ===== 二、AWB 出具手续 ===== -->
  <div class="card c2" id="card2">
    <div class="card-head" onclick="toggleCard('card2')">
      <div class="card-icon">二</div>
      <div class="card-meta">
        <div class="card-title">AWB 出具手续</div>
        <div class="card-desc">收到 AWB Instruction 后，前往 AWB Editor 制作并输出</div>
        <div class="card-pills">
          <span class="pill pill-green">Direct AWB</span>
          <span class="pill pill-teal">MAWB + HAWB</span>
        </div>
      </div>
      <div class="chevron">▼</div>
    </div>

    <div class="card-body">
      <div class="body-divider"></div>

      <div class="step s-green">
        <div class="snum">1</div>
        <div class="scontent">
          <h3>收到 AWB Instruction</h3>
          <p>客户或发货商提供清关资料及 AWB Instruction，操作组确认收到</p>
        </div>
      </div>
      <div class="sarrow">↓</div>

      <div class="step s-green">
        <div class="snum">2</div>
        <div class="scontent">
          <h3>判断 AWB 类型</h3>
          <button class="toggle-btn" onclick="toggleDetail(this)">查看说明 ▼</button>
          <div class="detail"><ul>
            <li><strong>Direct AWB（直单）</strong> — Issuer 为航司，一张 AWB 直接出给客户</li>
            <li><strong>MAWB + HAWB + Manifest</strong> — MAWB：Issuer 为航司；HAWB：Issuer 为 Agent；另附 Manifest</li>
          </ul></div>
        </div>
      </div>
      <div class="sarrow">↓</div>

      <div class="step s-key">
        <div class="snum">3</div>
        <div class="scontent">
          <h3>前往 AWB Editor 制作 AWB</h3>
          <p>根据清关资料在 AWB Editor 中填写发货人、收货人、航班信息、货物信息等</p>
          <a href="https://www.awbeditor.com/" target="_blank" class="ext-link">前往 AWB Editor ↗</a>
          <button class="toggle-btn" onclick="toggleDetail(this)" style="margin-left:8px">查看内容说明 ▼</button>
          <div class="detail"><ul>
            <li><strong>Direct AWB</strong>：Issuer 选航司，填写完整货物信息</li>
            <li><strong>MAWB</strong>：Issuer 选航司，对应航班舱位信息</li>
            <li><strong>HAWB</strong>：Issuer 选 Agent，内容与 MAWB 对应</li>
            <li><strong>Manifest</strong>：HAWB 附件，列明所有分单明细</li>
          </ul></div>
        </div>
      </div>
      <div class="sarrow">↓</div>

      <div class="step s-green">
        <div class="snum">4</div>
        <div class="scontent">
          <h3>导出 PDF，发邮件给客户确认</h3>
          <p>将制作完成的 AWB 导出为 PDF，通过邮件发送给客户确认内容无误</p>
        </div>
      </div>
      <div class="sarrow">↓</div>

      <div class="step s-green">
        <div class="snum">5</div>
        <div class="scontent">
          <h3>保存至 Google 云端</h3>
          <p>客户确认后，将 AWB 文件保存到 Google 云端对应案件文件夹归档</p>
          <span class="stag stag-gray">存档留底，便于后期追溯</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ===== 三、结算收款 ===== -->
  <div class="card c3" id="card3">
    <div class="card-head" onclick="toggleCard('card3')">
      <div class="card-icon">三</div>
      <div class="card-meta">
        <div class="card-title">结算收款</div>
        <div class="card-desc">案件完结后 — 发账单、确认账期、跟进回款</div>
        <div class="card-pills">
          <span class="pill pill-orange">3天内发账单</span>
          <span class="pill pill-orange">跟进回款</span>
        </div>
      </div>
      <div class="chevron">▼</div>
    </div>

    <div class="card-body">
      <div class="body-divider"></div>

      <div class="step s-orange">
        <div class="snum">1</div>
        <div class="scontent">
          <h3>案件完结确认</h3>
          <p>收货方签收，操作组更新 KINTONE，案件标记为完结</p>
        </div>
      </div>
      <div class="sarrow">↓</div>

      <div class="step s-key" style="border-left-color:#E88A2E;background:#fff9f0">
        <div class="snum" style="background:#E88A2E;color:#fff">2</div>
        <div class="scontent">
          <h3>发出账单</h3>
          <p>案件完结后 <strong>3 天内</strong> 向客户发出账单</p>
          <span class="stag stag-orange">时限要求：3天内</span>
        </div>
      </div>
      <div class="sarrow">↓</div>

      <div class="step s-orange">
        <div class="snum">3</div>
        <div class="scontent">
          <h3>客户确认账单</h3>
          <p>依据《客户付款判断及与信额度管理办法》确认账期及付款方式</p>
          <span class="stag stag-blue">OPTYT-3-YW-01</span>
        </div>
      </div>
      <div class="sarrow">↓</div>

      <div class="step s-orange">
        <div class="snum">4</div>
        <div class="scontent">
          <h3>跟进回款</h3>
          <p>根据账期及时跟进，确保款项按时收回</p>
          <span class="stag stag-orange">重点跟进</span>
        </div>
      </div>
    </div>
  </div>

</div>

<script>
function toggleCard(id) {
  const card = document.getElementById(id);
  card.classList.toggle('open');
}

function showSub(name, btn) {
  document.querySelectorAll('.sub-flow').forEach(f => f.classList.remove('active'));
  document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('flow-' + name).classList.add('active');
  btn.classList.add('active');
}

function toggleDetail(btn) {
  const detail = btn.nextElementSibling;
  const isOpen = detail.classList.contains('open');
  detail.classList.toggle('open', !isOpen);
  btn.textContent = isOpen ? '查看详情 ▼' : '收起详情 ▲';
}
</script>
</body>
</html>
