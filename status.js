'use strict';

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function (require) {
    'use strict';

    /**
     * ajax数据携带的业务status code配置
     * @type {Object}
     */

    var REQ_STATUS_CODE = {
        INITIALIZE: 0,
        SUCCESS: 200, // 这是成功的标识，下面的都是失败
        PARTFAIL: 300, // 业务部分失败
        REDIRECT: 302, // 需要转向另外一个地址
        FAIL: 400, // 业务失败
        SERVER_ERROR: 500, // 服务端异常
        PARAMETER_ERROR: 600, // 请求参数错误
        NOAUTH: 700, // 没有权限
        SERVER_EXCEEDED: 800, // 数量超过限制
        TIMEOUT: 900, // 超时
        CLIENT_SIDE_EXCEPTION: 910, // ajax成功了，但是后置处理数据抛出异常
        REQUEST_ERROR: 920, // ajax通讯发生了错误，这时需要去看httpStatus
        UNRECOGNIZED_STATUS: 930 // 返回的status没有被识别
    };

    /**
     * ajax的数据携带的业务status code对应的desc配置
     * @type {Object}
     */
    var REQ_STATUS_DESC = {
        INITIALIZE: 'ajax-initialize',
        SUCCESS: 'ajax-success',
        PARTFAIL: 'ajax-some-failed',
        REDIRECT: 'ajax-redirect',
        FAIL: 'ajax-fail',
        SERVER_ERROR: 'ajax-server-error',
        PARAMETER_ERROR: 'ajax-parameter-error',
        NOAUTH: 'ajax-noauth',
        SERVER_EXCEEDED: 'ajax-server-exceeded',
        TIMEOUT: 'ajax-timeout',
        CLIENT_SIDE_EXCEPTION: 'ajax-client-side-exception',
        REQUEST_ERROR: 'ajax-request-error',
        UNRECOGNIZED_STATUS: 'ajax-unrecognized-status'
    };

    // 模块声明时，自动初始化具体的code对应的描述，增加值对应的描述
    for (var key in REQ_STATUS_CODE) {
        if (REQ_STATUS_CODE.hasOwnProperty(key)) {
            REQ_STATUS_DESC[REQ_STATUS_CODE[key]] = REQ_STATUS_DESC[key];
        }
    }

    return {
        /**
         * @property {Mixed} [REQ_CODE] ajax行为处理结果的业务code
         */
        REQ_CODE: REQ_STATUS_CODE,

        /**
         * @property {Mixed} [REQ_CODE_DESC] ajax行为处理结果的业务code描述
         */
        REQ_CODE_DESC: REQ_STATUS_DESC
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9zdGF0dXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFJLE9BQU8sTUFBUCxLQUFrQixVQUFsQixFQUE4QjtBQUFDLFFBQUksU0FBUyxRQUFRLFVBQVIsRUFBb0IsTUFBcEIsQ0FBVCxDQUFMO0NBQWxDOztBQUVBLE9BQU8sVUFBVSxPQUFWLEVBQW1CO0FBQ3RCOzs7Ozs7QUFEc0I7QUFPdEIsUUFBTSxrQkFBa0I7QUFDcEIsb0JBQVksQ0FBWjtBQUNBLGlCQUFTLEdBQVQ7QUFDQSxrQkFBVSxHQUFWO0FBQ0Esa0JBQVUsR0FBVjtBQUNBLGNBQU0sR0FBTjtBQUNBLHNCQUFjLEdBQWQ7QUFDQSx5QkFBaUIsR0FBakI7QUFDQSxnQkFBUSxHQUFSO0FBQ0EseUJBQWlCLEdBQWpCO0FBQ0EsaUJBQVMsR0FBVDtBQUNBLCtCQUF1QixHQUF2QjtBQUNBLHVCQUFlLEdBQWY7QUFDQSw2QkFBcUIsR0FBckI7QUFib0IsS0FBbEI7Ozs7OztBQVBnQixRQTJCaEIsa0JBQWtCO0FBQ3BCLG9CQUFZLGlCQUFaO0FBQ0EsaUJBQVMsY0FBVDtBQUNBLGtCQUFVLGtCQUFWO0FBQ0Esa0JBQVUsZUFBVjtBQUNBLGNBQU0sV0FBTjtBQUNBLHNCQUFjLG1CQUFkO0FBQ0EseUJBQWlCLHNCQUFqQjtBQUNBLGdCQUFRLGFBQVI7QUFDQSx5QkFBaUIsc0JBQWpCO0FBQ0EsaUJBQVMsY0FBVDtBQUNBLCtCQUF1Qiw0QkFBdkI7QUFDQSx1QkFBZSxvQkFBZjtBQUNBLDZCQUFxQiwwQkFBckI7S0FiRTs7O0FBM0JnQixTQTRDakIsSUFBSSxHQUFKLElBQVcsZUFBaEIsRUFBaUM7QUFDN0IsWUFBSSxnQkFBZ0IsY0FBaEIsQ0FBK0IsR0FBL0IsQ0FBSixFQUF5QztBQUNyQyw0QkFBZ0IsZ0JBQWdCLEdBQWhCLENBQWhCLElBQXdDLGdCQUFnQixHQUFoQixDQUF4QyxDQURxQztTQUF6QztLQURKOztBQU1BLFdBQU87Ozs7QUFJSCxrQkFBVSxlQUFWOzs7OztBQUtBLHVCQUFlLGVBQWY7S0FUSixDQWxEc0I7Q0FBbkIsQ0FBUCIsImZpbGUiOiJzdGF0dXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpZiAodHlwZW9mIGRlZmluZSAhPT0gJ2Z1bmN0aW9uJykge3ZhciBkZWZpbmUgPSByZXF1aXJlKCdhbWRlZmluZScpKG1vZHVsZSl9XG5cbmRlZmluZShmdW5jdGlvbiAocmVxdWlyZSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIGFqYXjmlbDmja7mkLrluKbnmoTkuJrliqFzdGF0dXMgY29kZemFjee9rlxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgY29uc3QgUkVRX1NUQVRVU19DT0RFID0ge1xuICAgICAgICBJTklUSUFMSVpFOiAwLFxuICAgICAgICBTVUNDRVNTOiAyMDAsICAvLyDov5nmmK/miJDlip/nmoTmoIfor4bvvIzkuIvpnaLnmoTpg73mmK/lpLHotKVcbiAgICAgICAgUEFSVEZBSUw6IDMwMCwgIC8vIOS4muWKoemDqOWIhuWksei0pVxuICAgICAgICBSRURJUkVDVDogMzAyLCAgLy8g6ZyA6KaB6L2s5ZCR5Y+m5aSW5LiA5Liq5Zyw5Z2AXG4gICAgICAgIEZBSUw6IDQwMCwgIC8vIOS4muWKoeWksei0pVxuICAgICAgICBTRVJWRVJfRVJST1I6IDUwMCwgIC8vIOacjeWKoeerr+W8guW4uFxuICAgICAgICBQQVJBTUVURVJfRVJST1I6IDYwMCwgIC8vIOivt+axguWPguaVsOmUmeivr1xuICAgICAgICBOT0FVVEg6IDcwMCwgIC8vIOayoeacieadg+mZkFxuICAgICAgICBTRVJWRVJfRVhDRUVERUQ6IDgwMCwgIC8vIOaVsOmHj+i2hei/h+mZkOWItlxuICAgICAgICBUSU1FT1VUOiA5MDAsICAvLyDotoXml7ZcbiAgICAgICAgQ0xJRU5UX1NJREVfRVhDRVBUSU9OOiA5MTAsICAvLyBhamF45oiQ5Yqf5LqG77yM5L2G5piv5ZCO572u5aSE55CG5pWw5o2u5oqb5Ye65byC5bi4XG4gICAgICAgIFJFUVVFU1RfRVJST1I6IDkyMCwgIC8vIGFqYXjpgJrorq/lj5HnlJ/kuobplJnor6/vvIzov5nml7bpnIDopoHljrvnnItodHRwU3RhdHVzXG4gICAgICAgIFVOUkVDT0dOSVpFRF9TVEFUVVM6IDkzMCAgLy8g6L+U5Zue55qEc3RhdHVz5rKh5pyJ6KKr6K+G5YirXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIGFqYXjnmoTmlbDmja7mkLrluKbnmoTkuJrliqFzdGF0dXMgY29kZeWvueW6lOeahGRlc2PphY3nva5cbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIGNvbnN0IFJFUV9TVEFUVVNfREVTQyA9IHtcbiAgICAgICAgSU5JVElBTElaRTogJ2FqYXgtaW5pdGlhbGl6ZScsXG4gICAgICAgIFNVQ0NFU1M6ICdhamF4LXN1Y2Nlc3MnLFxuICAgICAgICBQQVJURkFJTDogJ2FqYXgtc29tZS1mYWlsZWQnLFxuICAgICAgICBSRURJUkVDVDogJ2FqYXgtcmVkaXJlY3QnLFxuICAgICAgICBGQUlMOiAnYWpheC1mYWlsJyxcbiAgICAgICAgU0VSVkVSX0VSUk9SOiAnYWpheC1zZXJ2ZXItZXJyb3InLFxuICAgICAgICBQQVJBTUVURVJfRVJST1I6ICdhamF4LXBhcmFtZXRlci1lcnJvcicsXG4gICAgICAgIE5PQVVUSDogJ2FqYXgtbm9hdXRoJyxcbiAgICAgICAgU0VSVkVSX0VYQ0VFREVEOiAnYWpheC1zZXJ2ZXItZXhjZWVkZWQnLFxuICAgICAgICBUSU1FT1VUOiAnYWpheC10aW1lb3V0JyxcbiAgICAgICAgQ0xJRU5UX1NJREVfRVhDRVBUSU9OOiAnYWpheC1jbGllbnQtc2lkZS1leGNlcHRpb24nLFxuICAgICAgICBSRVFVRVNUX0VSUk9SOiAnYWpheC1yZXF1ZXN0LWVycm9yJyxcbiAgICAgICAgVU5SRUNPR05JWkVEX1NUQVRVUzogJ2FqYXgtdW5yZWNvZ25pemVkLXN0YXR1cydcbiAgICB9O1xuXG4vLyDmqKHlnZflo7DmmI7ml7bvvIzoh6rliqjliJ3lp4vljJblhbfkvZPnmoRjb2Rl5a+55bqU55qE5o+P6L+w77yM5aKe5Yqg5YC85a+55bqU55qE5o+P6L+wXG4gICAgZm9yICh2YXIga2V5IGluIFJFUV9TVEFUVVNfQ09ERSkge1xuICAgICAgICBpZiAoUkVRX1NUQVRVU19DT0RFLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIFJFUV9TVEFUVVNfREVTQ1tSRVFfU1RBVFVTX0NPREVba2V5XV0gPSBSRVFfU1RBVFVTX0RFU0Nba2V5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcHJvcGVydHkge01peGVkfSBbUkVRX0NPREVdIGFqYXjooYzkuLrlpITnkIbnu5PmnpznmoTkuJrliqFjb2RlXG4gICAgICAgICAqL1xuICAgICAgICBSRVFfQ09ERTogUkVRX1NUQVRVU19DT0RFLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcHJvcGVydHkge01peGVkfSBbUkVRX0NPREVfREVTQ10gYWpheOihjOS4uuWkhOeQhue7k+aenOeahOS4muWKoWNvZGXmj4/ov7BcbiAgICAgICAgICovXG4gICAgICAgIFJFUV9DT0RFX0RFU0M6IFJFUV9TVEFUVVNfREVTQ1xuICAgIH07XG59KTtcbiJdfQ==