
var DrawingFramework, Executor, Point, ProgramHandler, allowed_commands, correct_command, process_command, process_program, transform_program,
    indexOf = [].indexOf;

Point = class Point {
    constructor(x1, y1) {
        this.x = x1;
        this.y = y1;
        if (Math.abs(this.x) < 1e-2) {
            this.x = 0;
        }
        if (Math.abs(this.y) < 1e-2) {
            this.y = 0;
        }
    }

    add(p) {
        return new Point(this.x + p.x, this.y + p.y);
    }

    sub(p) {
        return new Point(this.x - p.x, this.y - p.y);
    }

    mul(k) {
        return new Point(this.x * k, this.y * k);
    }

    scalar(p) {
        return this.x * p.x + this.y * p.y;
    }

    cross(p) {
        return this.x * p.y - p.x * this.y;
    }

    normalize(len) {
        return this.mul(len / this.length());
    }

    static degrees_to_radian(angle) {
        return angle * Math.PI / 180;
    }

    rotate_90() {
        return new Point(-this.y, this.x);
    }

    _rotate(cos_a, sin_a) {
        var u, v;
        v = this.mul(cos_a);
        u = this.rotate_90().mul(sin_a);
        return v.add(u);
    }

    rotate(angle) {
        // поворот против часовой
        return this._rotate(Math.cos(Point.degrees_to_radian(angle)), Math.sin(Point.degrees_to_radian(angle)));
    }

    length() {
        return Math.sqrt(this.scalar(this));
    }

    print() {
        return console.log(`${this.x} ${this.y}`);
    }

};

Executor = class Executor {
    constructor(x, y) {
        this.position = new Point(x, y);
        this.direction = new Point(-1, 0);
        this.positions = [this.position];
    }

    move(dist) {
        this.position = this.position.add(this.direction.normalize(dist));
        return this.positions.push(this.position);
    }

    rotate(angle) {
        return this.direction = this.direction.rotate(angle);
    }

};

ProgramHandler = class ProgramHandler {
    constructor(x, y, program1) {
        this.program = program1;
        this.executor = new Executor(x, y);
    }

    execute() {
        var ip, order, stack, value;
        stack = [];
        ip = 0;
        while (ip < this.program.length) {
            order = this.program[ip][0];
            value = Number(this.program[ip].slice(1));
            if (order === "j") {
                if (stack[stack.length - 1] > 0) {
                    ip = value;
                    stack[stack.length - 1] -= 1;
                } else {
                    stack.pop();
                }
            }
            if (order === "c") {
                stack.push(Math.max(value - 1, 0));
            }
            if (order === "f") {
                this.executor.move(value);
            }
            if (order === "l") {
                this.executor.rotate(value);
            }
            ip++;
        }
        return this.executor.positions;
    }

};

correct_command = /^\s*([a-zа-я]*)\s+(\d+)\s*$/i;

allowed_commands = ['повтори', 'вперед', 'налево', 'направо'];

process_command = function(line, line_number) {
    var command, match_obj, ref;
    match_obj = line.match(correct_command);
    if ((match_obj != null) && (ref = (command = match_obj[1].toLocaleLowerCase()), indexOf.call(allowed_commands, ref) >= 0)) {
        return [command, match_obj[2]];
    }
    throw `Некорректная команда или аргумент в строке ${line_number + 1}`;
};

transform_program = function(original_program) {
    var cycle_just_started, i, index, len1, line, order, program, stack;
    stack = [];
    program = [];
    cycle_just_started = false;
    for (index = i = 0, len1 = original_program.length; i < len1; index = ++i) {
        line = original_program[index];
        if (line === '') {
            continue;
        }
        if (cycle_just_started) {
            if (line.trim() !== "начало") {
                throw `Пропущено ключевое слово "начало" в строке ${index + 1}`;
            }
            cycle_just_started = false;
            continue;
        }
        if (line.trim() === "конец") {
            if (stack.length === 0) {
                throw `Ошибка во вложенных циклах. Возможно, лишнее ключевое слово "конец" в строке ${index + 1}`;
            }
            program.push(`j${stack.pop()}`);
            continue;
        }
        order = process_command(line, index);
        if (order[0] === "повтори") {
            program.push(`c${order[1]}`);
            stack.push(program.length - 1);
            cycle_just_started = true;
        }
        if (order[0] === "вперед") {
            program.push(`f${order[1]}`);
        }
        if (order[0] === "налево") {
            program.push(`l${order[1]}`);
        }
        if (order[0] === "направо") {
            program.push(`r${order[1]}`);
        }
    }
    if (stack.length > 0) {
        throw "Ошибка во вложенных циклах. Внимательно проверьте Вашу программу";
    }
    return program;
};

DrawingFramework = class DrawingFramework {
    constructor() {}

};

process_program = function(program = null) {
    var e, handler;
    try {
        program = program.split(/\n/);
        program = transform_program(program);
        handler = new ProgramHandler(0, 0, program);
        return [true, handler.execute()];
    } catch (error) {
        e = error;
        return [false, e];
    }
};

function enableTab(id) {
    var el = document.getElementById(id);
    el.onkeydown = function(e) {
        if (e.keyCode === 9) {
            var val = this.value,
                start = this.selectionStart,
                end = this.selectionEnd;
            this.value = val.substring(0, start) + '\t' + val.substring(end);
            this.selectionStart = this.selectionEnd = start + 1;
            return false;

        }
    };
}

//program = "повтори 4\nначало\nвперед 1\nналево 90\nконец"
//console.log program
//process_program(program)



//# sourceMappingURL=main.js.map
