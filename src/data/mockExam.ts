import { ExamResponse } from '../types';

export const mockExamData: ExamResponse = {
    "data": {
        "examTime": 90,
        "examinationPaperTitle": "202512GESP Python一级试卷",
        "paperQuestionsVOS": [
            {
                "id": "2018579259433934850",
                "type": 1,
                "title": "<p>近日 ，空中客车公司表⽰&nbsp;，约6000架空客A320系列飞机需要紧急更换一种易受太阳辐射影响的飞行控制软件&nbsp;。空客表⽰&nbsp;，在对一起飞行事故进行分析后&nbsp;，结果表明强烈的太阳辐射可能会损坏飞行控制系统所需的关键数据&nbsp;，导致判断失误&nbsp;，进而可能引发飞行异常&nbsp;。在这里的飞行控制系统中&nbsp;，执行判断的部件最可能是下面的(&nbsp;&nbsp;)。</p>",
                "referenceAnswer": "B",
                "analyzeContent": "<p><strong>解析：</strong></p><p>本题考查计算机硬件基础知识。</p><p>在计算机系统中，负责执行指令、进行算术和逻辑运算以及控制整个系统运行的核心部件是中央处理器（CPU）。CPU中的控制器负责指令的译码和执行控制，运算器负责数据的加工处理。</p><p>题目中提到的“执行判断”功能，属于逻辑运算的一部分，是由处理器（CPU）来完成的。辐射传感器用于检测辐射，内存单元用于存储数据，输出设备用于显示结果，它们都不具备“执行判断”的核心功能。</p><p>因此，正确答案是 <strong>B. 处理器</strong>。</p>",
                "score": 2,
                "questionsOptionList": [
                    {
                        "questionId": "2018579259433934850",
                        "questionOption": "A",
                        "questionOptionContent": "<p><strong>&nbsp;</strong>辐射传感器</p>",
                        "sortNum": 1
                    },
                    {
                        "questionId": "2018579259433934850",
                        "questionOption": "B",
                        "questionOptionContent": "<p>处理器</p>",
                        "sortNum": 2
                    },
                    {
                        "questionId": "2018579259433934850",
                        "questionOption": "C",
                        "questionOptionContent": "<p>内存单元</p>",
                        "sortNum": 3
                    },
                    {
                        "questionId": "2018579259433934850",
                        "questionOption": "D",
                        "questionOptionContent": "<p>输出设备</p>",
                        "sortNum": 4
                    }
                ]
            },
            {
                "id": "2018586106035429378",
                "type": 3,
                "title": "<p>鸿蒙是华为公司开发的一款操作系统&nbsp;，那么它能够将正确的源程序翻译成目标程序&nbsp;，并运行&nbsp;。&nbsp;(&nbsp;&nbsp;)</p>",
                "referenceAnswer": "0",
                "analyzeContent": "<p><strong>解析：</strong></p><p>本题考查操作系统和编译原理的基础知识。</p><p>操作系统（Operating System, OS）是管理计算机硬件与软件资源的计算机程序，同时也是计算机系统的内核与基石。它的主要功能包括进程管理、内存管理、文件系统、网络通信、安全机制等。</p><p>将源程序翻译成目标程序是<strong>编译器（Compiler）</strong>或<strong>解释器（Interpreter）</strong>的功能，而不是操作系统的直接功能。虽然操作系统提供了运行环境，但翻译代码本身是由语言处理程序完成的。</p><p>因此，该说法是<strong>错误</strong>的。</p>",
                "score": 2
            },
            {
                "id": "2018595093225136130",
                "type": 4,
                "title": "<p>·&nbsp;&nbsp;<strong>试题名称</strong>：手机电量显⽰</p><p><br></p><p><strong>3.2.1&nbsp;&nbsp;&nbsp;&nbsp;</strong>题目描述</p><p>小杨的手机就像一个聪明的小助手&nbsp;，当电量变化时&nbsp;，它会用不同的方式来提醒我们&nbsp;，假设当前的电量百分比为 <em>P:</em></p><p>当电量非常低（不超过 10，&nbsp;即 P ≤&nbsp;10）&nbsp;，它会显⽰一个大写字母 R&nbsp;，就像在说：“快给我充电吧！（Red警告⾊）&nbsp;”</p><p>当电量有点低（超过 10&nbsp;但不超过 20，&nbsp;即&nbsp;10&nbsp;&lt;&nbsp;P ≤&nbsp;20）&nbsp;，它会显⽰一个大写字母 L&nbsp;，意思是“&nbsp;电量有点Low啦！”</p><p>当电量比较充足（超过 20，&nbsp;即 P &gt;&nbsp;20）&nbsp;，它就会直接显⽰具体的数字&nbsp;，比如直接显⽰ 50&nbsp;，表⽰还有 50&nbsp;的电量。</p><p><br></p><p><strong>3.2.2&nbsp;&nbsp;&nbsp;&nbsp;</strong>输入格式</p><p>第一行一个正整数&nbsp;代表数据组数。</p><p>对于每组数据&nbsp;，一行包含一个正整数 代表手机电量百分比。</p><p><br></p><p><strong>3.2.3&nbsp;&nbsp;&nbsp;&nbsp;</strong>输出格式</p><p>对于每组数据&nbsp;，输出一行&nbsp;，代表当前手机显⽰的电量信息。</p><p><br></p><p><strong>3.2.4&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</strong>样例</p><p><strong>3.2.4.1&nbsp;&nbsp;&nbsp;&nbsp;</strong>输入样例</p><pre class=\"ql-syntax\" spellcheck=\"false\">5\n10\n1\n20\n99\n19\n</pre><p><strong>3.2.4.2&nbsp;&nbsp;&nbsp;&nbsp;</strong>输出样例</p><pre class=\"ql-syntax\" spellcheck=\"false\">R\nR\nL\n99\nL\n</pre><p><strong>3.2.4.3&nbsp;&nbsp;&nbsp;&nbsp;</strong>样例解释</p><p>输入样例&nbsp;1 共有五组数据：</p><p>第一组数据手机电量 P =&nbsp;10 ，满足 P&nbsp;≤&nbsp;10，&nbsp;电量非常低&nbsp;，显⽰&nbsp;R&nbsp;&nbsp;。</p><p>第二组数据手机电量 P =&nbsp;1 ，满足 P&nbsp;≤&nbsp;10，&nbsp;电量非常低&nbsp;，显⽰&nbsp;&nbsp;R&nbsp;。</p><p>第三组数据手机电量 P =&nbsp;20 ，满足&nbsp;10&nbsp;&lt;&nbsp;P ≤&nbsp;20，&nbsp;电量有点低&nbsp;，显⽰&nbsp;&nbsp;L&nbsp;。</p><p>第四组数据手机电量 P =&nbsp;99 ，满足 P&nbsp;&gt;&nbsp;20，&nbsp;电量比较充足&nbsp;，直接显⽰具体的数字&nbsp;99&nbsp;&nbsp;。&nbsp;</p><p>第五组数据手机电量 P =&nbsp;19 ，满足&nbsp;10&nbsp;&lt;&nbsp;P ≤&nbsp;20，&nbsp;电量有点低&nbsp;，显⽰&nbsp;&nbsp;L&nbsp;。</p><p><br></p><p><strong>3.2.5&nbsp;&nbsp;&nbsp;&nbsp;</strong>数据范围</p><p>对于所有测试点&nbsp;，保证&nbsp;1&nbsp;飞&nbsp;T&nbsp;≤&nbsp;20,&nbsp;1&nbsp;≤&nbsp;P&nbsp;≤&nbsp;100。</p><p><br></p>",
                "referenceAnswer": "",
                "analyzeContent": "<p><strong>解析：</strong></p><p>本题考查条件判断语句的使用。</p><p>根据题目描述，我们需要对输入的电量 $P$ 进行判断：</p><ul><li>如果 $P \\le 10$，输出 'R'。</li><li>如果 $10 < P \\le 20$，输出 'L'。</li><li>如果 $P > 20$，输出 $P$ 本身。</li></ul><p>由于有多组数据，我们需要先读取数据组数 $T$，然后循环 $T$ 次，每次读取一个 $P$ 并进行判断输出。</p><p><strong>参考代码 (Python)：</strong></p><pre>def solve():\n    try:\n        line = input().strip()\n        if not line: return # Handle empty lines if any\n        n = int(line)\n        for _ in range(n):\n            p = int(input().strip())\n            if p <= 10:\n                print('R')\n            elif p <= 20:\n                print('L')\n            else:\n                print(p)\n    except EOFError:\n        pass\n\nif __name__ == '__main__':\n    solve()</pre>",
                "score": 25,
                "questionsDetailDTO": {
                    "executionTimeLimit": 1000,
                    "executionMemoryLimit": 512,
                    "inputFormat": "",
                    "outputFormat": "",
                    "testPointList": [
                        {
                            "testCaseInput": "5\n10\n1\n20\n99\n19",
                            "testCaseOutput": "R\nR\nL\n99\nL"
                        }
                    ]
                }
            }
        ]
    },
    "code": 200,
    "msg": "操作成功"
};
