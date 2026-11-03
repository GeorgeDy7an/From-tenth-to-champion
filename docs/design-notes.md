# 设计与开发记录 / Design and development notes

## 01 · 让球员改变打法 / Let the lineup change the playbook

**问题。** 如果所有阵容决策都能化简成“谁评分高就上谁”，招募和换人很快就失去意义。我让球员的战术风格参与战术卡判定，同时保留基础评分的作用。这样，同一位球员在不同阵容中的价值会变化。

**取舍。** 只在战术卡和阵容风格页显示相关贡献，避免每张卡堆满数字。达到门槛时让加成明确可见。小样复现这个思路：五人的能力构成决定战术加成，三个选项共用随机样本，方便对照。

**Problem.** If the highest-rated card is always the right choice, recruiting and substitutions become routine. Player styles therefore contribute to tactic checks alongside base ability, so the same player can be more useful in a different lineup.

**Trade-off.** Show the relevant contribution on the tactic and lineup screens instead of crowding every card. The demo isolates the idea: the lineup changes each tactic's bonus, and a shared set of random samples makes comparisons easier.

## 02 · 保留成长，限制膨胀 / Preserve progression, contain runaway growth

**观察。** 无尽后段的训练、技能和羁绊叠加后，部分首领几乎失去了挑战。直接跟随玩家评分抬高对手，会让培养显得没有回报。我把对手分档与玩家成长上限分开处理。

**试验。** 一轮候选规则对照模拟了 **31,459 场引擎比赛**，包括固定阵容对照和从开局成长的征程。该样本中的最高实战评分从 **126 降至 105**；不看广告的样本中，首次紫卡机会是 **78/100 对 77/100**。中段普通关仍然太容易，因此没有把这轮结果当成“平衡已经完成”。

**Observation.** Stacking training, skills, and chemistry made some late bosses trivial. Scaling opponents directly with the player's rating would weaken the feeling of progression. I treated opponent tiers and the player growth ceiling as separate controls.

**Experiment.** One candidate comparison covered **31,459 engine-simulated games**, including fixed-lineup controls and runs with normal progression. The highest effective rating observed fell from **126 to 105**. In the no-ad sample, first-purple-card opportunities were **78/100 vs. 77/100**. Midgame regular matches remained too easy, so this was evidence of a narrower improvement, not proof of complete balance.

以上是特定候选规则与测试策略的模拟结果，不是线上玩家胜率。 / These were simulations under specific candidate rules and test policies, not live player win rates.

## 03 · 先保护进度，再恢复同步 / Protect progress before recovering sync

**问题。** 连续操作、限流与丢失的响应会产生不同类型的失败。一个通用报错无法说明写入究竟未发生，还是已完成但没有收到确认。

**实现。** 按存档位串行处理写入，合并密集更新，区分传输错误和真实内容冲突；重进先检查云端进度再处理待传事件。冲突时保留本地版本。离线版去掉同步链路，语言偏好与本地存档分开保存。

**验证。** 用故障与并发测试覆盖重复请求和旧请求覆盖问题。离线版额外在阻断外网时完成比赛、结算、切换语言和读档。公开的保存示例只展示串行队列，不包含正式协议。

**Problem.** Rapid actions, rate limiting, and lost replies fail in different ways. A generic error cannot tell you whether a write failed or whether it succeeded without an acknowledgment.

**Implementation.** Serialize writes per slot, coalesce frequent updates, distinguish transport failures from actual conflicts, and check remote progress before replaying pending events. Keep a local copy on conflict. The offline edition removes the sync path and stores language preference separately from progress.

**Verification.** Failure and concurrency tests covered duplicate requests and stale writes. The offline build was also tested through a completed game, settlement, language switch, and save reload with external requests blocked. The public save example demonstrates only the queue, without the production protocol.
