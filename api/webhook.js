const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Octokit } = require("@octokit/rest");

export default async function handler(req, res) {
  // اگر درخواست از نوع POST نبود، یعنی فقط داریم سرور را تست می‌کنیم
    if (req.method !== "POST") {
        return res.status(200).send("ایجنت بیدار و آماده است!");
          }

            const payload = req.body;
              
                // بررسی می‌کنیم که آیا کسی کامنت جدیدی گذاشته است؟
                  if (payload.action === "created" && payload.comment) {
                      
                          // جلوگیری از اینکه ایجنت با خودش چت کند و در یک حلقه بی‌نهایت بیفتد
                              if (payload.sender.type === "Bot" || payload.comment.user.login.includes("bot")) {
                                    return res.status(200).send("کامنت ربات نادیده گرفته شد.");
                                        }

                                            const userComment = payload.comment.body;
                                                const repoOwner = payload.repository.owner.login;
                                                    const repoName = payload.repository.name;
                                                        const issueNumber = payload.issue.number;

                                                            try {
                                                                  // ۱. اتصال به مغز جمینای
                                                                        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                                                                              const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
                                                                                    
                                                                                          // دستورالعمل سیستم (پرامپت اصلی)
                                                                                                const prompt = `تو یک دستیار برنامه‌نویس حرفه‌ای در گیت‌هاب هستی. به این سوال یا پیام کاربر پاسخ کوتاه، دقیق و راهگشا بده:\n\n${userComment}`;
                                                                                                      
                                                                                                            const result = await model.generateContent(prompt);
                                                                                                                  const aiResponse = result.response.text();

                                                                                                                        // ۲. ارسال جواب به گیت‌هاب
                                                                                                                              const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
                                                                                                                                    
                                                                                                                                          await octokit.issues.createComment({
                                                                                                                                                  owner: repoOwner,
                                                                                                                                                          repo: repoName,
                                                                                                                                                                  issue_number: issueNumber,
                                                                                                                                                                          body: aiResponse,
                                                                                                                                                                                });

                                                                                                                                                                                      return res.status(200).send("پاسخ با موفقیت ارسال شد!");
                                                                                                                                                                                            
                                                                                                                                                                                                } catch (error) {
                                                                                                                                                                                                      console.error(error);
                                                                                                                                                                                                            return res.status(500).send("یک خطایی رخ داد.");
                                                                                                                                                                                                                }
                                                                                                                                                                                                                  }

                                                                                                                                                                                                                    return res.status(200).send("عملیاتی نیاز نبود.");
                                                                                                                                                                                                                    }
                                                                                                                                                                                                                    