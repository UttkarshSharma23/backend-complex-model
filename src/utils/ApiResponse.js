/** 
 * HTTPS Responses
  1. Informartional Response (100-199)
  2. Successful Response (200-299)
  3. Redirection Messages (300-399)
  4. Client error Responses (400-499)
  5. Server error Responses (500 - 599)
 */


class ApiResponse{
    constructor(statusCode,data,message ="Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export default ApiResponse
