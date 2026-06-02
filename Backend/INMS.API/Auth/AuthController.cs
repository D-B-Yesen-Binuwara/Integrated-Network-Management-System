using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace INMS.API.Auth
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        [HttpPost("login")]
        public IActionResult Login(LoginRequest request)
        {
            if (request.Email == "testuser008@intranet.slt.com.lk" &&
    request.Password == "Gaya187171")
            {
                var claims = new[]
                {
                    new Claim(ClaimTypes.Name, request.Email),
                    new Claim(ClaimTypes.Role, "Admin")
                };

                var key = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes("ThisIsMySuperSecretKey12345ThisIsMySuperSecretKey12345"));

                var creds = new SigningCredentials(
                    key,
                    SecurityAlgorithms.HmacSha256);

                var token = new JwtSecurityToken(
                    claims: claims,
                    expires: DateTime.Now.AddHours(1),
                    signingCredentials: creds);

                var jwt = new JwtSecurityTokenHandler().WriteToken(token);

                return Ok(new
                {
                    token = jwt
                });
            }

            return Unauthorized("Invalid email or password");

        }
        [Authorize]
[HttpGet("secure-data")]
public IActionResult SecureData()
{
    return Ok("Only logged users can access this");
}
    }
}