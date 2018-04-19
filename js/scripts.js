
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
    constructor(x, y, step1, program1) {
        this.program = program1;
        this.executor = new Executor(x, y);
        this.step = step1
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
                this.executor.move(value * this.step);
            }
            if (order === "l") {
                this.executor.rotate(-value);
            }
            if (order === "r") {
                this.executor.rotate(value);
            }
            ip++;
        }
        return this.executor;
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
        if (line.trim() === '') {
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

process_program = function(x, y, step, program = null) {
    var e, handler;
    try {
        program = program.split(/\n/);
        program = transform_program(program);
        handler = new ProgramHandler(x, y, step, program);
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


function drawCircuit(canvasId, executor, cell_side=25) {
    let current_canvas = document.getElementById(canvasId);
    let contex = current_canvas.getContext("2d");
    contex.clearRect(0, 0, current_canvas.width, current_canvas.height);
    contex.moveTo(0, 0);
    contex.strokeStyle = "#dcdcdc";
    contex.lineWidth = 1;
    for (let x = 0.5 + cell_side; x < current_canvas.width; x += cell_side) {
        contex.moveTo(x, 0);
        contex.lineTo(x, current_canvas.height);
    }
    for (let y = 0.5 + cell_side; y < current_canvas.height; y += cell_side) {
        contex.moveTo(0, y);
        contex.lineTo(current_canvas.width, y)
    }
    contex.stroke();
    contex.beginPath();
    const sx = 250;
    const sy = 200;
    const k = 5.18;
    const k1 = 1.41;
    contex.moveTo(sx - 6 * cell_side, sy);
    contex.lineTo(sx + 6 * cell_side, sy);
    contex.lineTo(sx + 3 * cell_side, sy + k * cell_side);
    contex.lineTo(sx - 3 * cell_side, sy - k * cell_side);
    contex.lineTo(sx + 3 * cell_side, sy - k * cell_side);
    contex.lineTo(sx - 3 * cell_side, sy + k * cell_side);
    contex.lineTo(sx - 6 * cell_side, sy);
    contex.moveTo(sx, sy);
    contex.lineTo(sx, sy + 12 * cell_side);
    contex.moveTo(sx, sy + 8 * cell_side);
    contex.lineTo(sx + k1 * cell_side, sy + (8 - k1) * cell_side);
    contex.lineTo(sx + 2 * k1 * cell_side, sy + 8 * cell_side);
    contex.lineTo(sx + k1 * cell_side, sy + (8 + k1) * cell_side);
    contex.lineTo(sx, sy + 8 * cell_side);
    contex.lineWidth = 2;
    contex.setLineDash([5, 3]);
    contex.strokeStyle = "#ff0702";
    contex.stroke();
    contex.beginPath();
    contex.strokeStyle = "#000000";
    contex.setLineDash([1, 0]);
    contex.lineWidth = 4;
    var points = executor.positions;
    contex.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        console.log([points[i].x, points[i].y]);
        contex.lineTo(points[i].x, points[i].y);
    }
    contex.stroke();
    contex.beginPath();
    contex.lineWidth = 2;
    contex.strokeStyle = "#12c3be";
    contex.moveTo(points[points.length - 1].x, points[points.length - 1].y);
    let arrow = executor.position.add(executor.direction.normalize(3 * cell_side));
    let part = executor.position.add(executor.direction.normalize(2.6 * cell_side));
    let directing_vector = executor.direction.normalize(0.3 * cell_side).rotate(90);
    let left = part.add(directing_vector);
    let right = part.sub(directing_vector);
    //let left = part.add(executor.direction.rotate(90).normalize(0.5 * cell_side));
    //alert('kek1');
    contex.lineTo(arrow.x, arrow.y);
    contex.lineTo(left.x, left.y);
    contex.moveTo(arrow.x, arrow.y);
    contex.lineTo(right.x, right.y);
    contex.stroke();
    contex.beginPath();
    contex.lineWidth = 3;
    contex.strokeStyle = "#1f5713";
    contex.fillStyle = "#249f24";
    contex.arc(points[points.length - 1].x, points[points.length - 1].y, 10, 0, 2 * Math.PI);
    contex.fill();
    contex.stroke();
}
